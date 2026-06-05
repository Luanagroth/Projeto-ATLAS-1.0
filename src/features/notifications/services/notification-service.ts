import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type NotificationTypeValue =
  | "NON_CONFORMITY_CREATED"
  | "ACTION_PLAN_CREATED"
  | "ACTION_PLAN_COMPLETED"
  | "ACTION_PLAN_APPROVED"
  | "ACTION_PLAN_REJECTED"
  | "SYSTEM";

type RoleValue = "ADMIN" | "CONSULTANT" | "CLIENT";

type CreateNotificationInput = {
  href?: string | null;
  message: string;
  metadata?: Prisma.InputJsonValue | null;
  organizationId: string;
  relatedActionPlanId?: string | null;
  relatedAuditId?: string | null;
  relatedNCId?: string | null;
  title: string;
  type: NotificationTypeValue;
  userId: string;
};

export type NotificationListItem = Awaited<
  ReturnType<typeof listNotificationsForUser>
>[number];

export type HeaderNotificationItem = Awaited<
  ReturnType<typeof listRecentNotificationsForUser>
>[number];

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
        relatedNCId: input.relatedNCId ?? null,
        relatedActionPlanId: input.relatedActionPlanId ?? null,
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

    if (recipients.length === 0) {
      return { count: 0 };
    }

    return prisma.notification.createMany({
      data: recipients.map((recipient) => ({
        organizationId,
        userId: recipient.userId,
        type,
        title,
        message,
        href: href ?? null,
        metadata: metadata ?? undefined,
        relatedAuditId: relatedAuditId ?? null,
        relatedNCId: relatedNCId ?? null,
        relatedActionPlanId: relatedActionPlanId ?? null,
      })),
    });
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
            company: { select: { name: true } },
          },
        },
      },
    });

    if (!item) return { count: 0 };

    return this.createNotificationsForRoles({
      organizationId: item.audit.organizationId,
      roles: ["CLIENT"],
      type: "NON_CONFORMITY_CREATED",
      title: "Nova não conformidade registrada",
      message: `${item.audit.company.name}: ${item.title}`,
      href: `/non-conformities/${item.id}`,
      relatedAuditId: item.audit.id,
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
      title: "Novo plano de ação criado",
      message: `${item.nonConformity.audit.company.name}: ${item.title}`,
      href: `/action-plans/${item.id}`,
      relatedActionPlanId: item.id,
      relatedAuditId: item.nonConformity.audit.id,
      relatedNCId: item.nonConformity.id,
      metadata: { companyName: item.nonConformity.audit.company.name },
    });
  },

  async notifyReviewersAboutActionPlanCompleted(actionPlanId: string) {
    const item = await getActionPlanNotificationContext(actionPlanId);

    if (!item) return { count: 0 };

    const directRecipientId = item.createdById ?? item.responsibleId;

    if (directRecipientId) {
      await this.createNotification({
        organizationId: item.nonConformity.audit.organizationId,
        userId: directRecipientId,
        type: "ACTION_PLAN_COMPLETED",
        title: "Plano de ação enviado para revisão",
        message: `${item.nonConformity.audit.company.name}: ${item.title}`,
        href: `/action-plans/${item.id}`,
        relatedActionPlanId: item.id,
        relatedAuditId: item.nonConformity.audit.id,
        relatedNCId: item.nonConformity.id,
        metadata: { companyName: item.nonConformity.audit.company.name },
      });

      return { count: 1 };
    }

    return this.createNotificationsForRoles({
      organizationId: item.nonConformity.audit.organizationId,
      roles: ["ADMIN", "CONSULTANT"],
      type: "ACTION_PLAN_COMPLETED",
      title: "Plano de ação enviado para revisão",
      message: `${item.nonConformity.audit.company.name}: ${item.title}`,
      href: `/action-plans/${item.id}`,
      relatedActionPlanId: item.id,
      relatedAuditId: item.nonConformity.audit.id,
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
      title: approved ? "Plano de ação aprovado" : "Plano de ação reprovado",
      message: `${item.nonConformity.audit.company.name}: ${item.title}`,
      href: `/action-plans/${item.id}`,
      relatedActionPlanId: item.id,
      relatedAuditId: item.nonConformity.audit.id,
      relatedNCId: item.nonConformity.id,
      metadata: { companyName: item.nonConformity.audit.company.name },
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
              company: { select: { name: true } },
            },
          },
        },
      },
    },
  });
}

export async function listNotificationsForUser({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  return prisma.notification.findMany({
    where: { organizationId, userId },
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
