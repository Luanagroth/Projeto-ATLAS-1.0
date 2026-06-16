import "server-only";

import { prisma } from "@/lib/prisma";

import type { OrganizationSettingsValues } from "../schemas/settings-schema";
import type { UserSettingsValues } from "../schemas/user-settings-schema";

function optionalText(value?: string | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

export type SettingsOrganization = NonNullable<
  Awaited<ReturnType<typeof getOrganizationSettings>>
>;

export type SettingsUser = Awaited<
  ReturnType<typeof listOrganizationUsers>
>[number];

export type SettingsMetrics = Awaited<ReturnType<typeof getOrganizationMetrics>>;
export type EditableSettingsUser = NonNullable<
  Awaited<ReturnType<typeof getOrganizationUserForEdit>>
>;

export async function getOrganizationSettings(organizationId: string) {
  return prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      cnpj: true,
      logo: true,
      phone: true,
      email: true,
      address: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateOrganizationSettings({
  organizationId,
  logoPath,
  values,
}: {
  organizationId: string;
  logoPath?: string | null;
  values: OrganizationSettingsValues;
}) {
  return prisma.organization.update({
    where: { id: organizationId },
    data: {
      name: values.name.trim(),
      description: optionalText(values.description),
      cnpj: optionalText(values.cnpj),
      ...(logoPath !== undefined ? { logo: logoPath } : {}),
      phone: optionalText(values.phone),
      email: optionalText(values.email),
      address: optionalText(values.address),
    },
    select: { id: true },
  });
}

export async function listOrganizationUsers(organizationId: string) {
  return prisma.organizationMembership.findMany({
    where: { organizationId },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          emailVerified: true,
        },
      },
    },
  });
}

export async function getOrganizationUserForEdit({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  return prisma.organizationMembership.findFirst({
    where: { organizationId, userId },
    select: {
      id: true,
      role: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });
}

export async function updateOrganizationUser({
  organizationId,
  passwordHash,
  userId,
  values,
}: {
  organizationId: string;
  passwordHash?: string | null;
  userId: string;
  values: UserSettingsValues;
}) {
  const membership = await getOrganizationUserForEdit({ organizationId, userId });

  if (!membership) {
    return null;
  }

  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        name: optionalText(values.name),
        phone: optionalText(values.phone),
        email: values.email.trim().toLowerCase(),
        ...(passwordHash ? { password: passwordHash } : {}),
      },
    });

    await tx.organizationMembership.update({
      where: { id: membership.id },
      data: { role: values.role },
    });

    return { id: userId };
  });
}

export async function removeOrganizationUserAccess({
  currentUserId,
  organizationId,
  userId,
}: {
  currentUserId: string;
  organizationId: string;
  userId: string;
}) {
  if (currentUserId === userId) {
    return { removed: false, reason: "self" as const };
  }

  const membership = await prisma.organizationMembership.findFirst({
    where: { organizationId, userId },
    select: { id: true, role: true },
  });

  if (!membership) {
    return { removed: false, reason: "not_found" as const };
  }

  if (membership.role === "ADMIN") {
    const adminCount = await prisma.organizationMembership.count({
      where: { organizationId, role: "ADMIN" },
    });

    if (adminCount <= 1) {
      return { removed: false, reason: "last_admin" as const };
    }
  }

  await prisma.organizationMembership.delete({
    where: { id: membership.id },
  });

  return { removed: true };
}

export async function getOrganizationMetrics(organizationId: string) {
  const [
    users,
    companies,
    audits,
    checklistTemplates,
    appliedChecklists,
    nonConformitiesOpen,
    nonConformitiesTotal,
    actionPlansOpen,
    actionPlansAwaitingReview,
    actionPlansApproved,
    unreadNotifications,
  ] = await Promise.all([
    prisma.organizationMembership.count({ where: { organizationId } }),
    prisma.company.count({ where: { organizationId } }),
    prisma.audit.count({ where: { organizationId } }),
    prisma.checklist.count({ where: { organizationId } }),
    prisma.auditChecklist.count({
      where: { audit: { organizationId } },
    }),
    prisma.nonConformity.count({
      where: { audit: { organizationId }, status: { not: "RESOLVED" } },
    }),
    prisma.nonConformity.count({
      where: { audit: { organizationId } },
    }),
    prisma.actionPlan.count({
      where: {
        nonConformity: { audit: { organizationId } },
        status: { in: ["OPEN", "IN_PROGRESS"] },
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
    prisma.notification.count({
      where: { organizationId, read: false },
    }),
  ]);

  return {
    actionPlansApproved,
    actionPlansAwaitingReview,
    actionPlansOpen,
    appliedChecklists,
    audits,
    checklistTemplates,
    companies,
    nonConformitiesOpen,
    nonConformitiesTotal,
    unreadNotifications,
    users,
  };
}
