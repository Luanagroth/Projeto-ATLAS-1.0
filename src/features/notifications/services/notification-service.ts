import "server-only";

import { NotificationType, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { notificationTypeLabels } from "../notification-types";
export {
  notificationTypeLabels,
  notificationTypeOptions,
} from "../notification-types";

type RoleValue = "ADMIN" | "CONSULTANT" | "CLIENT";

type CreateNotificationInput = {
  href?: string | null;
  message: string;
  metadata?: Prisma.InputJsonValue | null;
  organizationId: string;
  relatedActionPlanId?: string | null;
  relatedAuditId?: string | null;
  relatedCompanyId?: string | null;
  relatedDocumentId?: string | null;
  relatedEvidenceId?: string | null;
  relatedNCId?: string | null;
  title: string;
  type: NotificationType;
  userId: string;
};

type NotificationFilters = {
  read?: string;
  type?: string;
};

export type NotificationListItem = Awaited<
  ReturnType<typeof listNotificationsForUser>
>[number];

export type HeaderNotificationItem = Awaited<
  ReturnType<typeof listRecentNotificationsForUser>
>[number];

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

async function createNotificationOncePerDay(input: CreateNotificationInput) {
  const existing = await prisma.notification.findFirst({
    where: {
      organizationId: input.organizationId,
      userId: input.userId,
      type: input.type,
      href: input.href ?? null,
      createdAt: { gte: startOfToday() },
    },
    select: { id: true },
  });

  if (existing) return existing;

  return NotificationService.createNotification(input);
}

export const NotificationService = {
  async createNotification(input: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        href: input.href ?? null,
        metadata: input.metadata ?? undefined,
        relatedAuditId: input.relatedAuditId ?? null,
        relatedCompanyId: input.relatedCompanyId ?? null,
        relatedNCId: input.relatedNCId ?? null,
        relatedActionPlanId: input.relatedActionPlanId ?? null,
        relatedEvidenceId: input.relatedEvidenceId ?? null,
        relatedDocumentId: input.relatedDocumentId ?? null,
      },
      select: { id: true },
    });
  },

  async createNotificationsForRoles({
    excludeUserId,
    href,
    message,
    metadata,
    organizationId,
    relatedActionPlanId,
    relatedAuditId,
    relatedCompanyId,
    relatedDocumentId,
    relatedEvidenceId,
    relatedNCId,
    roles,
    title,
    type,
  }: Omit<CreateNotificationInput, "userId"> & {
    excludeUserId?: string | null;
    roles: RoleValue[];
  }) {
    const recipients = await prisma.organizationMembership.findMany({
      where: {
        organizationId,
        role: { in: roles },
        ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
      },
      select: { userId: true },
    });

    let count = 0;
    for (const recipient of recipients) {
      await createNotificationOncePerDay({
        organizationId,
        userId: recipient.userId,
        type,
        title,
        message,
        href: href ?? null,
        metadata,
        relatedActionPlanId,
        relatedAuditId,
        relatedCompanyId,
        relatedDocumentId,
        relatedEvidenceId,
        relatedNCId,
      });
      count += 1;
    }

    return { count };
  },

  async notifyClientsAboutNonConformity(nonConformityId: string) {
    const item = await prisma.nonConformity.findUnique({
      where: { id: nonConformityId },
      select: {
        id: true,
        title: true,
        audit: {
          select: {
            id: true,
            organizationId: true,
            company: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!item) return { count: 0 };

    return this.createNotificationsForRoles({
      organizationId: item.audit.organizationId,
      roles: ["CLIENT"],
      type: "NON_CONFORMITY_CREATED",
      title: "Nova nao conformidade registrada",
      message: `${item.audit.company.name}: ${item.title}`,
      href: `/non-conformities/${item.id}`,
      relatedAuditId: item.audit.id,
      relatedCompanyId: item.audit.company.id,
      relatedNCId: item.id,
      metadata: { companyName: item.audit.company.name },
    });
  },

  async notifyClientsAboutActionPlan(actionPlanId: string) {
    const item = await getActionPlanNotificationContext(actionPlanId);
    if (!item) return { count: 0 };

    return this.createNotificationsForRoles({
      organizationId: item.nonConformity.audit.organizationId,
      roles: ["CLIENT"],
      type: "ACTION_PLAN_CREATED",
      title: "Novo plano de acao criado",
      message: `${item.nonConformity.audit.company.name}: ${item.title}`,
      href: `/action-plans/${item.id}`,
      relatedActionPlanId: item.id,
      relatedAuditId: item.nonConformity.audit.id,
      relatedCompanyId: item.nonConformity.audit.company.id,
      relatedNCId: item.nonConformity.id,
      metadata: { companyName: item.nonConformity.audit.company.name },
    });
  },

  async notifyReviewersAboutActionPlanCompleted(actionPlanId: string) {
    const item = await getActionPlanNotificationContext(actionPlanId);
    if (!item) return { count: 0 };

    return this.createNotificationsForRoles({
      organizationId: item.nonConformity.audit.organizationId,
      roles: ["ADMIN", "CONSULTANT"],
      type: "ACTION_PLAN_ANSWERED",
      title: "Plano respondido pela empresa",
      message: `${item.nonConformity.audit.company.name}: ${item.title}`,
      href: `/action-plans/${item.id}`,
      relatedActionPlanId: item.id,
      relatedAuditId: item.nonConformity.audit.id,
      relatedCompanyId: item.nonConformity.audit.company.id,
      relatedNCId: item.nonConformity.id,
      metadata: { companyName: item.nonConformity.audit.company.name },
    });
  },

  async notifyClientsAboutActionPlanReview({
    actionPlanId,
    approved,
  }: {
    actionPlanId: string;
    approved: boolean;
  }) {
    const item = await getActionPlanNotificationContext(actionPlanId);
    if (!item) return { count: 0 };

    return this.createNotificationsForRoles({
      organizationId: item.nonConformity.audit.organizationId,
      roles: ["CLIENT"],
      type: approved ? "ACTION_PLAN_APPROVED" : "ACTION_PLAN_REJECTED",
      title: approved ? "Plano de acao aprovado" : "Plano de acao reprovado",
      message: `${item.nonConformity.audit.company.name}: ${item.title}`,
      href: `/action-plans/${item.id}`,
      relatedActionPlanId: item.id,
      relatedAuditId: item.nonConformity.audit.id,
      relatedCompanyId: item.nonConformity.audit.company.id,
      relatedNCId: item.nonConformity.id,
      metadata: { companyName: item.nonConformity.audit.company.name },
    });
  },

  async notifyEvidenceCreated(evidenceId: string) {
    const evidence = await getEvidenceNotificationContext(evidenceId);
    if (!evidence) return { count: 0 };

    return this.createNotificationsForRoles({
      organizationId: evidence.audit.organizationId,
      roles: ["ADMIN", "CONSULTANT"],
      type: "EVIDENCE_CREATED",
      title: "Nova evidencia anexada",
      message: `${evidence.audit.company.name}: ${evidence.title}`,
      href: `/action-plans/${evidence.actionPlanId}?from=${evidence.audit.id}`,
      relatedActionPlanId: evidence.actionPlanId,
      relatedAuditId: evidence.audit.id,
      relatedCompanyId: evidence.audit.company.id,
      relatedEvidenceId: evidence.id,
      relatedNCId: evidence.nonConformityId,
    });
  },

  async notifyEvidenceReview({
    evidenceId,
    status,
  }: {
    evidenceId: string;
    status: "APPROVED" | "REJECTED" | "ADJUSTMENT_REQUESTED";
  }) {
    const evidence = await getEvidenceNotificationContext(evidenceId);
    if (!evidence) return { count: 0 };
    const type =
      status === "APPROVED"
        ? "EVIDENCE_APPROVED"
        : status === "REJECTED"
          ? "EVIDENCE_REJECTED"
          : "EVIDENCE_ADJUSTMENT_REQUESTED";
    const title =
      status === "APPROVED"
        ? "Evidencia aprovada"
        : status === "REJECTED"
          ? "Evidencia reprovada"
          : "Ajuste solicitado em evidencia";

    return this.createNotificationsForRoles({
      organizationId: evidence.audit.organizationId,
      roles: ["CLIENT"],
      type,
      title,
      message: `${evidence.audit.company.name}: ${evidence.title}`,
      href: `/action-plans/${evidence.actionPlanId}`,
      relatedActionPlanId: evidence.actionPlanId,
      relatedAuditId: evidence.audit.id,
      relatedCompanyId: evidence.audit.company.id,
      relatedEvidenceId: evidence.id,
      relatedNCId: evidence.nonConformityId,
    });
  },

  async notifyOpinionCompleted(auditId: string) {
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      select: {
        id: true,
        organizationId: true,
        title: true,
        company: { select: { id: true, name: true } },
      },
    });
    if (!audit) return { count: 0 };

    return this.createNotificationsForRoles({
      organizationId: audit.organizationId,
      roles: ["ADMIN", "CONSULTANT"],
      type: "OPINION_COMPLETED",
      title: "Parecer da auditora concluido",
      message: `${audit.company.name}: ${audit.title}`,
      href: `/audits/${audit.id}#parecer`,
      relatedAuditId: audit.id,
      relatedCompanyId: audit.company.id,
    });
  },

  async notifyAuditCompleted(auditId: string) {
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      select: {
        id: true,
        organizationId: true,
        title: true,
        company: { select: { id: true, name: true } },
      },
    });
    if (!audit) return { count: 0 };

    return this.createNotificationsForRoles({
      organizationId: audit.organizationId,
      roles: ["ADMIN", "CONSULTANT", "CLIENT"],
      type: "AUDIT_COMPLETED",
      title: "Auditoria finalizada",
      message: `${audit.company.name}: ${audit.title}`,
      href: `/audits/${audit.id}`,
      relatedAuditId: audit.id,
      relatedCompanyId: audit.company.id,
    });
  },

  async notifyDocumentCreated(documentId: string) {
    const document = await prisma.auditDocument.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        title: true,
        audit: {
          select: {
            id: true,
            organizationId: true,
            title: true,
            company: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!document) return { count: 0 };

    return this.createNotificationsForRoles({
      organizationId: document.audit.organizationId,
      roles: ["ADMIN", "CONSULTANT"],
      type: "DOCUMENT_CREATED",
      title: "Documento anexado",
      message: `${document.audit.company.name}: ${document.title}`,
      href: `/audits/${document.audit.id}#documentos`,
      relatedAuditId: document.audit.id,
      relatedCompanyId: document.audit.company.id,
      relatedDocumentId: document.id,
    });
  },

  async notifyPossibleIrregularities({
    auditId,
    count,
    organizationId,
  }: {
    auditId: string;
    count: number;
    organizationId: string;
  }) {
    if (count === 0) return { count: 0 };
    const audit = await prisma.audit.findFirst({
      where: { id: auditId, organizationId },
      select: {
        id: true,
        title: true,
        company: { select: { id: true, name: true } },
      },
    });
    if (!audit) return { count: 0 };

    return this.createNotificationsForRoles({
      organizationId,
      roles: ["ADMIN", "CONSULTANT"],
      type: "POSSIBLE_IRREGULARITY_CREATED",
      title: "Possiveis irregularidades geradas",
      message: `${audit.company.name}: ${count} item(ns) nao conforme(s) para revisao`,
      href: `/audits/${audit.id}#irregularidades`,
      relatedAuditId: audit.id,
      relatedCompanyId: audit.company.id,
    });
  },
};

async function getActionPlanNotificationContext(actionPlanId: string) {
  return prisma.actionPlan.findUnique({
    where: { id: actionPlanId },
    select: {
      id: true,
      title: true,
      createdById: true,
      responsibleId: true,
      nonConformity: {
        select: {
          id: true,
          audit: {
            select: {
              id: true,
              organizationId: true,
              company: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });
}

async function getEvidenceNotificationContext(evidenceId: string) {
  return prisma.evidence.findUnique({
    where: { id: evidenceId },
    select: {
      id: true,
      title: true,
      actionPlanId: true,
      nonConformityId: true,
      audit: {
        select: {
          id: true,
          organizationId: true,
          company: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export async function syncOperationalNotificationsForUser({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  const now = new Date();
  const inSevenDays = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7);
  const tomorrow = new Date(now.getTime() + 1000 * 60 * 60 * 24);

  const [auditsDueSoon, plansDueSoon, plansOverdue] = await Promise.all([
    prisma.audit.findMany({
      where: {
        organizationId,
        status: { in: ["DRAFT", "IN_PROGRESS"] },
        dueDate: { gte: now, lte: inSevenDays },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        company: { select: { id: true, name: true } },
      },
      take: 20,
    }),
    prisma.actionPlan.findMany({
      where: {
        nonConformity: { audit: { organizationId } },
        status: { in: ["OPEN", "IN_PROGRESS", "REJECTED"] },
        dueDate: { gte: now, lte: tomorrow },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        nonConformity: {
          select: {
            id: true,
            audit: {
              select: {
                id: true,
                company: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      take: 20,
    }),
    prisma.actionPlan.findMany({
      where: {
        nonConformity: { audit: { organizationId } },
        status: { in: ["OPEN", "IN_PROGRESS", "AWAITING_REVIEW", "REJECTED"] },
        dueDate: { lt: now },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        nonConformity: {
          select: {
            id: true,
            audit: {
              select: {
                id: true,
                company: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      take: 20,
    }),
  ]);

  for (const audit of auditsDueSoon) {
    await createNotificationOncePerDay({
      organizationId,
      userId,
      type: "AUDIT_DUE_SOON",
      title: "Prazo de auditoria proximo",
      message: `${audit.company.name}: ${audit.title}`,
      href: `/audits/${audit.id}`,
      relatedAuditId: audit.id,
      relatedCompanyId: audit.company.id,
    });
  }

  for (const plan of plansDueSoon) {
    await createNotificationOncePerDay({
      organizationId,
      userId,
      type: "ACTION_PLAN_DUE_SOON",
      title: "Plano proximo do vencimento",
      message: `${plan.nonConformity.audit.company.name}: ${plan.title}`,
      href: `/action-plans/${plan.id}`,
      relatedActionPlanId: plan.id,
      relatedAuditId: plan.nonConformity.audit.id,
      relatedCompanyId: plan.nonConformity.audit.company.id,
      relatedNCId: plan.nonConformity.id,
    });
  }

  for (const plan of plansOverdue) {
    await createNotificationOncePerDay({
      organizationId,
      userId,
      type: "ACTION_PLAN_OVERDUE",
      title: "Plano de acao vencido",
      message: `${plan.nonConformity.audit.company.name}: ${plan.title}`,
      href: `/action-plans/${plan.id}`,
      relatedActionPlanId: plan.id,
      relatedAuditId: plan.nonConformity.audit.id,
      relatedCompanyId: plan.nonConformity.audit.company.id,
      relatedNCId: plan.nonConformity.id,
    });
  }
}

export async function listNotificationsForUser({
  filters = {},
  organizationId,
  userId,
}: {
  filters?: NotificationFilters;
  organizationId: string;
  userId: string;
}) {
  const typeFilter =
    filters.type && filters.type in notificationTypeLabels
      ? (filters.type as NotificationType)
      : null;

  return prisma.notification.findMany({
    where: {
      organizationId,
      userId,
      ...(filters.read === "unread" ? { read: false } : {}),
      ...(filters.read === "read" ? { read: true } : {}),
      ...(typeFilter ? { type: typeFilter } : {}),
    },
    orderBy: [{ read: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      href: true,
      read: true,
      readAt: true,
      createdAt: true,
      relatedAuditId: true,
      relatedCompanyId: true,
      relatedNCId: true,
      relatedActionPlanId: true,
      relatedEvidenceId: true,
      relatedDocumentId: true,
    },
  });
}

export async function listRecentNotificationsForUser({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  return prisma.notification.findMany({
    where: { organizationId, userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      message: true,
      href: true,
      read: true,
      createdAt: true,
    },
  });
}

export async function countUnreadNotificationsForUser({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  return prisma.notification.count({
    where: { organizationId, userId, read: false },
  });
}

export async function markNotificationAsReadForUser({
  id,
  organizationId,
  userId,
}: {
  id: string;
  organizationId: string;
  userId: string;
}) {
  const result = await prisma.notification.updateMany({
    where: { id, organizationId, userId, read: false },
    data: { read: true, readAt: new Date() },
  });

  return result.count > 0;
}

export async function markAllNotificationsAsReadForUser({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  return prisma.notification.updateMany({
    where: { organizationId, userId, read: false },
    data: { read: true, readAt: new Date() },
  });
}
