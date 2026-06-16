import "server-only";

import { prisma } from "@/lib/prisma";

import type { AuditFormValues } from "../schemas/audit-schema";
import type { AuditStatusValue } from "../schemas/audit-schema";

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

type AuditFilters = {
  q?: string;
};

function optionalSearchText(value?: string | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

export type AuditListItem = Awaited<
  ReturnType<typeof listAuditsByOrganization>
>[number];

export type AuditDetails = NonNullable<
  Awaited<ReturnType<typeof getAuditByIdForOrganization>>
>;

export type AuditCompanyOption = Awaited<
  ReturnType<typeof listAuditCompanyOptions>
>[number];

export type AuditIndicators = Awaited<
  ReturnType<typeof getAuditIndicators>
>;

export type AuditHistoryItem = Awaited<
  ReturnType<typeof getAuditHistory>
>[number];

export type AuditNonConformityItem = Awaited<
  ReturnType<typeof getAuditNonConformities>
>[number];

export type AuditActionPlanItem = Awaited<
  ReturnType<typeof getAuditActionPlans>
>[number];

export type AuditVerificationItem = Awaited<
  ReturnType<typeof getAuditVerificationItems>
>[number];

export type AuditEvidenceItems = Awaited<
  ReturnType<typeof getAuditEvidenceItems>
>;

export type AuditOperationalOverview = Awaited<
  ReturnType<typeof getAuditOperationalOverview>
>;

export async function listAuditsByOrganization(organizationId: string) {
  return listAuditsByOrganizationWithFilters(organizationId);
}

export async function listAuditsByOrganizationWithFilters(
  organizationId: string,
  filters: AuditFilters = {},
) {
  const q = optionalSearchText(filters.q);

  return prisma.audit.findMany({
    where: {
      organizationId,
      ...(q
        ? {
            company: {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { cnpj: { contains: q, mode: "insensitive" } },
              ],
            },
          }
        : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      status: true,
      dueDate: true,
      createdAt: true,
      company: {
        select: {
          id: true,
          name: true,
          cnpj: true,
        },
      },
    },
  });
}

export async function getAuditByIdForOrganization({
  auditId,
  organizationId,
}: {
  auditId: string;
  organizationId: string;
}) {
  return prisma.audit.findFirst({
    where: {
      id: auditId,
      organizationId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      startDate: true,
      endDate: true,
      dueDate: true,
      createdAt: true,
      updatedAt: true,
      company: {
        select: {
          id: true,
          name: true,
          cnpj: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function getAuditIndicators({
  auditId,
  organizationId,
}: {
  auditId: string;
  organizationId: string;
}) {
  const now = new Date();

  const [
    checklistsApplied,
    checklistsCompleted,
    itemsTotal,
    itemsAnswered,
    ncsOpen,
    ncsInProgress,
    ncsResolved,
    plansOpen,
    plansInProgress,
    plansCompleted,
    plansAwaitingReview,
    plansRejected,
    plansOverdue,
  ] = await Promise.all([
    prisma.auditChecklist.count({
      where: { auditId, audit: { organizationId } },
    }),
    prisma.auditChecklist.count({
      where: { auditId, audit: { organizationId }, status: "COMPLETED" },
    }),
    prisma.auditChecklistItem.count({
      where: { auditChecklist: { auditId, audit: { organizationId } } },
    }),
    prisma.checklistResponse.count({
      where: { auditId, audit: { organizationId } },
    }),
    prisma.nonConformity.count({
      where: { auditId, audit: { organizationId }, status: "OPEN" },
    }),
    prisma.nonConformity.count({
      where: { auditId, audit: { organizationId }, status: "IN_PROGRESS" },
    }),
    prisma.nonConformity.count({
      where: { auditId, audit: { organizationId }, status: "RESOLVED" },
    }),
    prisma.actionPlan.count({
      where: {
        nonConformity: { auditId, audit: { organizationId } },
        status: "OPEN",
      },
    }),
    prisma.actionPlan.count({
      where: {
        nonConformity: { auditId, audit: { organizationId } },
        status: "IN_PROGRESS",
      },
    }),
    prisma.actionPlan.count({
      where: {
        nonConformity: { auditId, audit: { organizationId } },
        status: "APPROVED",
      },
    }),
    prisma.actionPlan.count({
      where: {
        nonConformity: { auditId, audit: { organizationId } },
        status: "AWAITING_REVIEW",
      },
    }),
    prisma.actionPlan.count({
      where: {
        nonConformity: { auditId, audit: { organizationId } },
        status: "REJECTED",
      },
    }),
    // Planos com prazo vencido que ainda não foram concluídos/aprovados
    prisma.actionPlan.count({
      where: {
        nonConformity: { auditId, audit: { organizationId } },
        dueDate: { lt: now },
        status: { notIn: ["APPROVED", "REJECTED"] },
      },
    }),
  ]);

  return {
    checklistsApplied,
    checklistsCompleted,
    itemsTotal,
    itemsAnswered,
    ncsOpen,
    ncsInProgress,
    ncsResolved,
    plansOpen,
    plansInProgress,
    plansCompleted,
    plansAwaitingReview,
    plansRejected,
    plansOverdue,
    ncsTotal: ncsOpen + ncsInProgress + ncsResolved,
    plansTotal: plansOpen + plansInProgress + plansCompleted + plansAwaitingReview + plansRejected,
  };
}

export async function getAuditNonConformities({
  auditId,
  organizationId,
}: {
  auditId: string;
  organizationId: string;
}) {
  return prisma.nonConformity.findMany({
    where: { auditId, audit: { organizationId } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      severity: true,
      status: true,
      correctionDeadline: true,
      createdAt: true,
      responsible: {
        select: { name: true, email: true },
      },
      _count: {
        select: { actionPlans: true },
      },
    },
  });
}

export async function getAuditActionPlans({
  auditId,
  organizationId,
}: {
  auditId: string;
  organizationId: string;
}) {
  const now = new Date();

  const plans = await prisma.actionPlan.findMany({
    where: {
      nonConformity: { auditId, audit: { organizationId } },
    },
    orderBy: [
      // Atrasados primeiro, depois por prazo ascendente
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      completedAt: true,
      createdAt: true,
      responsible: {
        select: { name: true, email: true },
      },
      nonConformity: {
        select: {
          id: true,
          title: true,
          severity: true,
        },
      },
    },
  });

  // Calcula dias em atraso no servidor para evitar hidratação client/server
  return plans.map((plan) => {
    const isOverdue =
      plan.dueDate !== null &&
      plan.dueDate < now &&
      plan.status !== "APPROVED" &&
      plan.status !== "REJECTED";

    const overdueDays =
      isOverdue && plan.dueDate
        ? Math.floor((now.getTime() - plan.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    return { ...plan, isOverdue, overdueDays };
  });
}

export async function getAuditHistory({
  auditId,
  organizationId,
}: {
  auditId: string;
  organizationId: string;
}) {
  return prisma.auditLog.findMany({
    where: { auditId, organizationId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      action: true,
      entity: true,
      changes: true,
      createdAt: true,
    },
  });
}

export async function getAuditVerificationItems({
  auditId,
  organizationId,
}: {
  auditId: string;
  organizationId: string;
}) {
  return prisma.actionPlan.findMany({
    where: {
      nonConformity: {
        auditId,
        audit: { organizationId },
      },
      OR: [
        { status: "AWAITING_REVIEW" },
        { evidences: { some: {} } },
      ],
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      status: true,
      dueDate: true,
      nonConformity: {
        select: {
          id: true,
          title: true,
        },
      },
      evidences: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          title: true,
          origin: true,
          status: true,
          createdAt: true,
          attachedBy: {
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

export async function getAuditEvidenceItems({
  auditId,
  organizationId,
}: {
  auditId: string;
  organizationId: string;
}) {
  const [actionPlanEvidences, checklistItemEvidences] = await Promise.all([
    prisma.evidence.findMany({
      where: {
        auditId,
        audit: { organizationId },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        origin: true,
        status: true,
        fileUrl: true,
        createdAt: true,
        actionPlan: {
          select: {
            id: true,
            title: true,
          },
        },
        nonConformity: {
          select: {
            id: true,
            title: true,
          },
        },
        attachedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.checklistResponse.findMany({
      where: {
        auditId,
        audit: { organizationId },
        evidence: { not: null },
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        evidence: true,
        notes: true,
        updatedAt: true,
        respondent: {
          select: {
            name: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            name: true,
            email: true,
          },
        },
        auditChecklistItem: {
          select: {
            order: true,
            question: true,
            auditChecklist: {
              select: {
                checklistName: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return {
    actionPlanEvidences,
    checklistItemEvidences,
  };
}

export async function getAuditOperationalOverview({
  auditId,
  organizationId,
}: {
  auditId: string;
  organizationId: string;
}) {
  const [
    audit,
    checklistsApplied,
    conformingItems,
    nonConformingItems,
    possibleIrregularities,
    ncsOpen,
    actionPlans,
    plansInVerification,
    plansAwaitingResponse,
    pendingEvidences,
    documentsCount,
  ] = await Promise.all([
    prisma.audit.findFirst({
      where: { id: auditId, organizationId },
      select: {
        status: true,
        dueDate: true,
        opinion: { select: { status: true } },
      },
    }),
    prisma.auditChecklist.count({
      where: { auditId, audit: { organizationId } },
    }),
    prisma.checklistResponse.count({
      where: {
        auditId,
        audit: { organizationId },
        answerBoolean: true,
      },
    }),
    prisma.checklistResponse.count({
      where: {
        auditId,
        audit: { organizationId },
        answerBoolean: false,
      },
    }),
    prisma.auditChecklistItem.count({
      where: {
        auditChecklist: { auditId, audit: { organizationId } },
        responses: {
          some: {
            auditId,
            answerBoolean: false,
          },
        },
        nonConformities: { none: {} },
        nonConformityLinks: { none: {} },
      },
    }),
    prisma.nonConformity.count({
      where: {
        auditId,
        audit: { organizationId },
        status: { not: "RESOLVED" },
      },
    }),
    prisma.actionPlan.count({
      where: {
        nonConformity: { auditId, audit: { organizationId } },
      },
    }),
    prisma.actionPlan.count({
      where: {
        nonConformity: { auditId, audit: { organizationId } },
        status: "AWAITING_REVIEW",
      },
    }),
    prisma.actionPlan.count({
      where: {
        nonConformity: { auditId, audit: { organizationId } },
        status: { in: ["OPEN", "IN_PROGRESS", "REJECTED"] },
      },
    }),
    prisma.evidence.count({
      where: {
        auditId,
        audit: { organizationId },
        status: "PENDING",
      },
    }),
    prisma.auditDocument.count({
      where: { auditId, audit: { organizationId } },
    }),
  ]);
  const now = new Date();
  const isNearDueDate =
    audit?.dueDate !== null &&
    audit?.dueDate !== undefined &&
    audit.dueDate.getTime() - now.getTime() <= 1000 * 60 * 60 * 24 * 7 &&
    audit.dueDate >= now;
  const needsOpinionBeforeClose =
    audit?.status === "IN_PROGRESS" &&
    isNearDueDate &&
    audit.opinion?.status !== "COMPLETED";

  return {
    actionPlans,
    checklistsApplied,
    conformingItems,
    documentsCount,
    ncsOpen,
    nonConformingItems,
    opinionStatus: audit?.opinion?.status ?? "DRAFT",
    needsOpinionBeforeClose,
    pendingEvidences,
    plansAwaitingResponse,
    plansInVerification,
    possibleIrregularities,
  };
}

export async function listAuditCompanyOptions(organizationId: string) {
  return prisma.company.findMany({
    where: {
      organizationId,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      cnpj: true,
    },
  });
}

export async function companyBelongsToOrganization({
  companyId,
  organizationId,
}: {
  companyId: string;
  organizationId: string;
}) {
  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      organizationId,
    },
    select: {
      id: true,
    },
  });

  return Boolean(company);
}

export async function createAuditForOrganization({
  createdById,
  organizationId,
  values,
}: {
  createdById: string;
  organizationId: string;
  values: AuditFormValues;
}) {
  return prisma.$transaction(async (tx) => {
    const audit = await tx.audit.create({
      data: {
        organizationId,
        companyId: values.companyId,
        createdById,
        title: values.title.trim(),
        status: values.status,
        description: optionalText(values.description),
        startDate:
          values.status === "IN_PROGRESS"
            ? optionalDate(values.startDate) ?? new Date()
            : optionalDate(values.startDate),
        dueDate: optionalDate(values.dueDate),
      },
      select: {
        id: true,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId,
        auditId: audit.id,
        action: "CREATED",
        entity: "AUDIT",
        changes: JSON.stringify({ status: values.status }),
      },
    });

    return audit;
  });
}

export async function updateAuditStatusForOrganization({
  auditId,
  organizationId,
  status,
}: {
  auditId: string;
  organizationId: string;
  status: AuditStatusValue;
}) {
  const current = await prisma.audit.findFirst({
    where: { id: auditId, organizationId },
    select: { id: true, status: true },
  });

  if (!current) {
    return null;
  }

  const previousStatus = current.status;

  return prisma.$transaction(async (tx) => {
    const data: {
      status: AuditStatusValue;
      startDate?: Date;
      endDate?: Date | null;
    } = { status };

    if (status === "IN_PROGRESS" && previousStatus === "DRAFT") {
      data.startDate = new Date();
    }

    if (status === "COMPLETED" || status === "CANCELLED") {
      data.endDate = new Date();
    }

    if (status === "IN_PROGRESS" && previousStatus === "COMPLETED") {
      data.endDate = null;
    }

    if (status === "CANCELLED") {
      data.endDate = new Date();
    }

    const updated = await tx.audit.update({
      where: { id: current.id },
      data,
      select: { id: true, status: true },
    });

    await tx.auditLog.create({
      data: {
        organizationId,
        auditId: current.id,
        action: "STATUS_CHANGED",
        entity: "AUDIT",
        changes: JSON.stringify({
          from: previousStatus,
          to: status,
        }),
      },
    });

    return updated;
  });
}

export async function logAuditEvent({
  action,
  auditId,
  changes,
  entity,
  organizationId,
}: {
  action: string;
  auditId: string;
  changes?: Record<string, unknown>;
  entity: string;
  organizationId: string;
}) {
  return prisma.auditLog.create({
    data: {
      organizationId,
      auditId,
      action,
      entity,
      changes: changes ? JSON.stringify(changes) : null,
    },
  });
}
