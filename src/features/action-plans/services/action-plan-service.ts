import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import {
  actionPlanStatusLabels,
  type ActionPlanFormValues,
  type ActionPlanStatusValue,
} from "../schemas/action-plan-schema";

function optionalText(value?: string | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function optionalDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function statusHistoryMessage(status: ActionPlanStatusValue) {
  return `Status alterado para ${actionPlanStatusLabels[status]}.`;
}

function resolveNonConformityStatusFromPlans(statuses: ActionPlanStatusValue[]) {
  return statuses.length > 0 && statuses.every((status) => status === "APPROVED")
    ? {
        resolvedAt: new Date(),
        status: "RESOLVED" as const,
      }
    : {
        resolvedAt: null,
        status: "IN_PROGRESS" as const,
      };
}

function normalizeExtraFields(values?: ActionPlanFormValues["extraFields"]) {
  const fields = (values ?? [])
    .map((field) => ({
      key: field.key.trim(),
      value: field.value.trim(),
    }))
    .filter((field) => field.key || field.value);

  return fields.length > 0 ? fields : null;
}

async function syncActionPlanExtraFields(
  tx: { $executeRaw: typeof prisma.$executeRaw },
  {
    actionPlanId,
    values,
  }: {
    actionPlanId: string;
    values?: ActionPlanFormValues["extraFields"];
  },
) {
  const fields = normalizeExtraFields(values);

  if (!fields) {
    await tx.$executeRaw`
      UPDATE "public"."ActionPlan"
      SET "extraFields" = NULL
      WHERE "id" = ${actionPlanId}
    `;
    return;
  }

  await tx.$executeRaw`
    UPDATE "public"."ActionPlan"
    SET "extraFields" = CAST(${JSON.stringify(fields)} AS jsonb)
    WHERE "id" = ${actionPlanId}
  `;
}

async function loadActionPlanExtraFieldsMap(ids: string[]) {
  if (ids.length === 0) {
    return new Map<string, unknown>();
  }

  const rows = await prisma.$queryRaw<Array<{ id: string; extraFields: unknown }>>(
    Prisma.sql`
      SELECT "id", "extraFields"
      FROM "public"."ActionPlan"
      WHERE "id" IN (${Prisma.join(ids)})
    `,
  );

  return new Map(rows.map((row) => [row.id, row.extraFields]));
}

export function parseActionPlanExtraFields(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((field) => {
      if (!field || typeof field !== "object") {
        return null;
      }

      const key = "key" in field && typeof field.key === "string" ? field.key : "";
      const valueText =
        "value" in field && typeof field.value === "string" ? field.value : "";

      if (!key && !valueText) {
        return null;
      }

      return { key, value: valueText };
    })
    .filter((field): field is { key: string; value: string } => Boolean(field));
}

export type ActionPlanListItem = Awaited<
  ReturnType<typeof listActionPlansByOrganization>
>[number];

export type ActionPlanDetails = NonNullable<
  Awaited<ReturnType<typeof getActionPlanByIdForOrganization>>
>;

export type ActionPlanNonConformityOption = Awaited<
  ReturnType<typeof getNonConformityOptionForOrganization>
>;

export type ActionPlanNonConformityListOption = Awaited<
  ReturnType<typeof listNonConformityOptionsForAudit>
>[number];

export type ActionPlanUserOption = Awaited<
  ReturnType<typeof listOrganizationUserOptions>
>[number];

export type NonConformityActionPlanItem = Awaited<
  ReturnType<typeof listActionPlansForNonConformity>
>[number];

export async function getActionPlanIndicators(organizationId: string) {
  const [open, inProgress, awaitingReview, approved, rejected] =
    await Promise.all([
      prisma.actionPlan.count({
        where: { nonConformity: { audit: { organizationId } }, status: "OPEN" },
      }),
      prisma.actionPlan.count({
        where: {
          nonConformity: { audit: { organizationId } },
          status: "IN_PROGRESS",
        },
      }),
      prisma.actionPlan.count({
        where: {
          nonConformity: { audit: { organizationId } },
          status: "AWAITING_REVIEW",
        },
      }),
      prisma.actionPlan.count({
        where: {
          nonConformity: { audit: { organizationId } },
          status: "APPROVED",
        },
      }),
      prisma.actionPlan.count({
        where: {
          nonConformity: { audit: { organizationId } },
          status: "REJECTED",
        },
      }),
    ]);

  return { open, inProgress, awaitingReview, approved, rejected };
}

export async function listActionPlansByOrganization(organizationId: string) {
  return prisma.actionPlan.findMany({
    where: {
      nonConformity: {
        audit: {
          organizationId,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      completedAt: true,
      createdAt: true,
      nonConformity: {
        select: {
          id: true,
          title: true,
          audit: {
            select: {
              title: true,
              company: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      responsible: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function listActionPlansForNonConformity({
  nonConformityId,
  organizationId,
}: {
  nonConformityId: string;
  organizationId: string;
}) {
  return prisma.actionPlan.findMany({
    where: {
      OR: [
        {
          nonConformityId,
          nonConformity: {
            audit: {
              organizationId,
            },
          },
        },
        {
          nonConformities: {
            some: {
              nonConformityId,
              nonConformity: {
                audit: {
                  organizationId,
                },
              },
            },
          },
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      completedAt: true,
      responsible: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function getActionPlanByIdForOrganization({
  id,
  organizationId,
}: {
  id: string;
  organizationId: string;
}) {
  const item = await prisma.actionPlan.findFirst({
    where: {
      id,
      OR: [
        { nonConformity: { audit: { organizationId } } },
        {
          nonConformities: {
            some: { nonConformity: { audit: { organizationId } } },
          },
        },
      ],
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      dueDate: true,
      completedAt: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      nonConformity: {
        select: {
          id: true,
          title: true,
          status: true,
          severity: true,
          checklistItemLinks: {
            select: {
              auditChecklistItem: {
                select: {
                  id: true,
                  question: true,
                  order: true,
                  auditChecklist: {
                    select: {
                      checklistName: true,
                    },
                  },
                },
              },
            },
          },
          auditChecklistItem: {
            select: {
              id: true,
              question: true,
              order: true,
              type: true,
              responses: {
                take: 1,
                select: {
                  answerBoolean: true,
                  answerText: true,
                  answerNumber: true,
                  answerDate: true,
                  answerChoice: true,
                  notes: true,
                  evidence: true,
                  updatedAt: true,
                },
              },
              auditChecklist: {
                select: {
                  checklistName: true,
                },
              },
            },
          },
          audit: {
            select: {
              id: true,
              title: true,
              company: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      nonConformities: {
        select: {
          nonConformity: {
            select: {
              id: true,
              title: true,
              checklistItemLinks: {
                select: {
                  auditChecklistItem: {
                    select: {
                      id: true,
                      question: true,
                      order: true,
                      auditChecklist: {
                        select: {
                          checklistName: true,
                        },
                      },
                    },
                  },
                },
              },
              auditChecklistItem: {
                select: {
                  id: true,
                  question: true,
                  order: true,
                  type: true,
                  responses: {
                    take: 1,
                    select: {
                      answerBoolean: true,
                      answerText: true,
                      answerNumber: true,
                      answerDate: true,
                      answerChoice: true,
                      notes: true,
                      evidence: true,
                      updatedAt: true,
                    },
                  },
                  auditChecklist: {
                    select: {
                      checklistName: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
      responsible: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      history: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          action: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      evidences: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          title: true,
          description: true,
          fileUrl: true,
          origin: true,
          status: true,
          reviewNotes: true,
          reviewedAt: true,
          createdAt: true,
          attachedBy: {
            select: {
              name: true,
              email: true,
            },
          },
          reviewedBy: {
            select: {
              name: true,
              email: true,
            },
          },
          nonConformity: {
            select: {
              id: true,
              title: true,
            },
          },
          auditChecklistItem: {
            select: {
              id: true,
              question: true,
              auditChecklist: {
                select: {
                  checklistName: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!item) {
    return null;
  }

  const extraFieldsById = await loadActionPlanExtraFieldsMap([item.id]);

  return {
    ...item,
    extraFields: extraFieldsById.get(item.id) ?? null,
  };
}

export async function listNonConformityOptionsForAudit({
  auditId,
  organizationId,
}: {
  auditId: string;
  organizationId: string;
}) {
  return prisma.nonConformity.findMany({
    where: {
      auditId,
      audit: { organizationId },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      severity: true,
      correctionDeadline: true,
      correctionNotes: true,
      audit: {
        select: {
          id: true,
          title: true,
          company: {
            select: { name: true },
          },
        },
      },
    },
  });
}

export async function getNonConformityOptionForOrganization({
  id,
  organizationId,
}: {
  id: string;
  organizationId: string;
}) {
  return prisma.nonConformity.findFirst({
    where: {
      id,
      audit: {
        organizationId,
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      severity: true,
      correctionDeadline: true,
      correctionNotes: true,
      audit: {
        select: {
          id: true,
          title: true,
          company: {
            select: {
              name: true,
            },
          },
        },
      },
      auditChecklistItem: {
        select: {
                  id: true,
                  question: true,
                  order: true,
                  type: true,
                  responses: {
                    take: 1,
                    select: {
                      answerBoolean: true,
                      answerText: true,
                      answerNumber: true,
                      answerDate: true,
                      answerChoice: true,
                      notes: true,
                      evidence: true,
                      updatedAt: true,
                    },
                  },
                  auditChecklist: {
                    select: {
                      checklistName: true,
            },
          },
        },
      },
      checklistItemLinks: {
        select: {
          auditChecklistItem: {
            select: {
                      id: true,
                      question: true,
                      order: true,
                      type: true,
                      responses: {
                        take: 1,
                        select: {
                          answerBoolean: true,
                          answerText: true,
                          answerNumber: true,
                          answerDate: true,
                          answerChoice: true,
                          notes: true,
                          evidence: true,
                          updatedAt: true,
                        },
                      },
                      auditChecklist: {
                        select: {
                          checklistName: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function listOrganizationUserOptions(organizationId: string) {
  return prisma.organizationMembership.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
    select: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function createActionPlanForOrganization({
  createdById,
  organizationId,
  values,
}: {
  createdById: string;
  organizationId: string;
  values: ActionPlanFormValues;
}) {
  const nonConformity = await getNonConformityOptionForOrganization({
    id: values.nonConformityId,
    organizationId,
  });

  if (!nonConformity) {
    return null;
  }

  return prisma.$transaction(async (tx) => {
    const created = await tx.actionPlan.create({
      data: {
        nonConformityId: values.nonConformityId,
        createdById,
        responsibleId: optionalText(values.responsibleId),
        title: values.title.trim(),
        description: optionalText(values.description),
        status: values.status,
        priority: values.priority,
        dueDate: optionalDate(values.dueDate),
        completedAt:
          values.status === "AWAITING_REVIEW" ||
          values.status === "APPROVED" ||
          values.status === "REJECTED"
            ? new Date()
            : null,
        notes: optionalText(values.notes),
        nonConformities: {
          create: {
            nonConformityId: values.nonConformityId,
          },
        },
        history: {
          create: [
            { userId: createdById, action: "Plano de ação criado." },
            { userId: createdById, action: statusHistoryMessage(values.status) },
          ],
        },
      },
      select: { id: true, nonConformityId: true },
    });

    await syncActionPlanExtraFields(tx, {
      actionPlanId: created.id,
      values: values.extraFields,
    });

    return created;
  });
}

export async function updateActionPlanForOrganization({
  id,
  organizationId,
  userId,
  values,
}: {
  id: string;
  organizationId: string;
  userId: string;
  values: ActionPlanFormValues;
}) {
  const current = await prisma.actionPlan.findFirst({
    where: {
      id,
      nonConformity: {
        audit: {
          organizationId,
        },
      },
    },
    select: {
      id: true,
      status: true,
      nonConformityId: true,
      nonConformities: {
        select: {
          nonConformityId: true,
        },
      },
    },
  });

  if (!current) {
    return null;
  }

  const completedAt =
    values.status === "AWAITING_REVIEW" ||
    values.status === "APPROVED" ||
    values.status === "REJECTED"
      ? new Date()
      : null;

  return prisma.$transaction(async (tx) => {
    await tx.actionPlan.update({
      where: { id: current.id },
      data: {
        responsibleId: optionalText(values.responsibleId),
        title: values.title.trim(),
        description: optionalText(values.description),
        status: values.status,
        priority: values.priority,
        dueDate: optionalDate(values.dueDate),
        completedAt,
        notes: optionalText(values.notes),
      },
    });

    await syncActionPlanExtraFields(tx, {
      actionPlanId: current.id,
      values: values.extraFields,
    });

    await tx.actionPlanHistory.create({
      data: {
        actionPlanId: current.id,
        userId,
        action:
          current.status === values.status
            ? "Plano de ação atualizado."
            : statusHistoryMessage(values.status),
      },
    });

    return {
      id: current.id,
      nonConformityId: current.nonConformityId,
    };
  });
}

export async function updateActionPlanStatusForOrganization({
  id,
  organizationId,
  status,
  userId,
}: {
  id: string;
  organizationId: string;
  status: ActionPlanStatusValue;
  userId: string;
}) {
  const current = await prisma.actionPlan.findFirst({
    where: {
      id,
      nonConformity: {
        audit: {
          organizationId,
        },
      },
    },
    select: {
      id: true,
      status: true,
      nonConformityId: true,
      nonConformities: {
        select: {
          nonConformityId: true,
        },
      },
    },
  });

  if (!current) {
    return null;
  }

  const linkedNonConformityIds = Array.from(
    new Set([
      current.nonConformityId,
      ...current.nonConformities.map((link) => link.nonConformityId),
    ]),
  );

  return prisma.$transaction(async (tx) => {
    await tx.actionPlan.update({
      where: { id: current.id },
      data: {
        status,
        completedAt:
          status === "AWAITING_REVIEW" ||
          status === "APPROVED" ||
          status === "REJECTED"
            ? new Date()
            : null,
      },
    });

    const relatedPlans = await tx.actionPlan.findMany({
      where: {
        OR: [
          { nonConformityId: { in: linkedNonConformityIds } },
          {
            nonConformities: {
              some: {
                nonConformityId: { in: linkedNonConformityIds },
              },
            },
          },
        ],
      },
      select: {
        status: true,
        nonConformityId: true,
        nonConformities: {
          select: {
            nonConformityId: true,
          },
        },
      },
    });

    const statusesByNonConformity = new Map<string, ActionPlanStatusValue[]>();

    for (const nonConformityId of linkedNonConformityIds) {
      statusesByNonConformity.set(nonConformityId, []);
    }

    for (const plan of relatedPlans) {
      const relatedNonConformityIds = Array.from(
        new Set([
          plan.nonConformityId,
          ...plan.nonConformities.map((link) => link.nonConformityId),
        ]),
      );

      for (const nonConformityId of relatedNonConformityIds) {
        const statuses = statusesByNonConformity.get(nonConformityId);

        if (statuses) {
          statuses.push(plan.status);
        }
      }
    }

    for (const nonConformityId of linkedNonConformityIds) {
      const statuses = statusesByNonConformity.get(nonConformityId) ?? [];

      await tx.nonConformity.update({
        where: { id: nonConformityId },
        data: resolveNonConformityStatusFromPlans(statuses),
      });
    }

    await tx.actionPlanHistory.create({
      data: {
        actionPlanId: current.id,
        userId,
        action: statusHistoryMessage(status),
      },
    });

    return {
      id: current.id,
      nonConformityId: current.nonConformityId,
    };
  });
}

export async function deleteActionPlanForOrganization({
  id,
  organizationId,
}: {
  id: string;
  organizationId: string;
}) {
  const current = await prisma.actionPlan.findFirst({
    where: {
      id,
      nonConformity: {
        audit: {
          organizationId,
        },
      },
    },
    select: {
      id: true,
      nonConformityId: true,
      _count: {
        select: {
          history: true,
        },
      },
    },
  });

  if (!current) {
    return { deleted: false, reason: "not_found" as const };
  }

  if (current._count.history > 2) {
    return { deleted: false, reason: "has_history" as const };
  }

  await prisma.actionPlan.delete({
    where: { id: current.id },
  });

  return {
    deleted: true,
    nonConformityId: current.nonConformityId,
  };
}
