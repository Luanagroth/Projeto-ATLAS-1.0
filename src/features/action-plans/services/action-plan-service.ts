import "server-only";

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

export type ActionPlanListItem = Awaited<
  ReturnType<typeof listActionPlansByOrganization>
>[number];

export type ActionPlanDetails = NonNullable<
  Awaited<ReturnType<typeof getActionPlanByIdForOrganization>>
>;

export type ActionPlanNonConformityOption = Awaited<
  ReturnType<typeof getNonConformityOptionForOrganization>
>;

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
      nonConformityId,
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
  return prisma.actionPlan.findFirst({
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

  return prisma.actionPlan.create({
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
      history: {
        create: [
          { userId: createdById, action: "Plano de ação criado." },
          { userId: createdById, action: statusHistoryMessage(values.status) },
        ],
      },
    },
    select: { id: true, nonConformityId: true },
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
    },
  });

  if (!current) {
    return null;
  }

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
