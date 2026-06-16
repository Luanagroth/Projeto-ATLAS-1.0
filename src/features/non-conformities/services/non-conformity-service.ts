import "server-only";

import { prisma } from "@/lib/prisma";

import type { NonConformityFormValues } from "../schemas/non-conformity-schema";

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

function checklistItemIds(values: NonConformityFormValues) {
  return Array.from(
    new Set(
      [
        optionalText(values.auditChecklistItemId),
        ...(values.auditChecklistItemIds ?? []).map((itemId) =>
          optionalText(itemId),
        ),
      ].filter((itemId): itemId is string => Boolean(itemId)),
    ),
  );
}

export type NonConformityListItem = Awaited<
  ReturnType<typeof listNonConformitiesByOrganization>
>[number];

export type NonConformityDetails = NonNullable<
  Awaited<ReturnType<typeof getNonConformityByIdForOrganization>>
>;

export type NonConformityAuditOption = Awaited<
  ReturnType<typeof listAuditOptions>
>[number];

export type NonConformityChecklistItemOption = Awaited<
  ReturnType<typeof listAuditChecklistItemOptions>
>[number];

export async function getNonConformityIndicators(organizationId: string) {
  const [open, inProgress, resolved, critical] = await Promise.all([
    prisma.nonConformity.count({
      where: { audit: { organizationId }, status: "OPEN" },
    }),
    prisma.nonConformity.count({
      where: { audit: { organizationId }, status: "IN_PROGRESS" },
    }),
    prisma.nonConformity.count({
      where: { audit: { organizationId }, status: "RESOLVED" },
    }),
    prisma.nonConformity.count({
      where: { audit: { organizationId }, severity: "CRITICAL" },
    }),
  ]);

  return { open, inProgress, resolved, critical };
}

export async function listNonConformitiesByOrganization(organizationId: string) {
  return prisma.nonConformity.findMany({
    where: {
      audit: {
        organizationId,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      severity: true,
      status: true,
      correctionDeadline: true,
      createdAt: true,
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
      responsible: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function getNonConformityByIdForOrganization({
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
      status: true,
      correctionDeadline: true,
      correctionNotes: true,
      resolvedAt: true,
      createdAt: true,
      updatedAt: true,
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
              auditChecklist: {
                select: {
                  checklistName: true,
                },
              },
            },
          },
        },
      },
      createdBy: { select: { name: true, email: true } },
      responsible: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function listAuditOptions(organizationId: string) {
  return prisma.audit.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      company: { select: { name: true } },
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

export async function listAuditChecklistItemOptions({
  auditId,
  organizationId,
}: {
  auditId: string;
  organizationId: string;
}) {
  return prisma.auditChecklistItem.findMany({
    where: {
      auditChecklist: {
        auditId,
        audit: { organizationId },
      },
    },
    orderBy: [{ auditChecklist: { createdAt: "asc" } }, { order: "asc" }],
    select: {
      id: true,
      question: true,
      auditChecklist: {
        select: {
          checklistName: true,
        },
      },
      nonConformities: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  });
}

export async function auditBelongsToOrganization({
  auditId,
  organizationId,
}: {
  auditId: string;
  organizationId: string;
}) {
  const audit = await prisma.audit.findFirst({
    where: { id: auditId, organizationId },
    select: { id: true },
  });

  return Boolean(audit);
}

export async function createNonConformityForOrganization({
  createdById,
  values,
}: {
  createdById: string;
  values: NonConformityFormValues;
}) {
  const linkedItemIds = checklistItemIds(values);

  return prisma.nonConformity.create({
    data: {
      auditId: values.auditId,
      auditChecklistItemId: optionalText(values.auditChecklistItemId),
      createdById,
      responsibleId: optionalText(values.responsibleId),
      title: values.title.trim(),
      description: values.description.trim(),
      severity: values.severity,
      status: values.status,
      correctionDeadline: optionalDate(values.correctionDeadline),
      correctionNotes: optionalText(values.correctionNotes),
      resolvedAt: values.status === "RESOLVED" ? new Date() : null,
      checklistItemLinks:
        linkedItemIds.length > 0
          ? {
              create: linkedItemIds.map((auditChecklistItemId) => ({
                auditChecklistItemId,
              })),
            }
          : undefined,
    },
    select: { id: true },
  });
}

export async function updateNonConformityForOrganization({
  id,
  organizationId,
  values,
}: {
  id: string;
  organizationId: string;
  values: NonConformityFormValues;
}) {
  const current = await prisma.nonConformity.findFirst({
    where: { id, audit: { organizationId } },
    select: { id: true },
  });

  if (!current) {
    return false;
  }

  const linkedItemIds = checklistItemIds(values);

  await prisma.$transaction(async (tx) => {
    await tx.nonConformity.update({
      where: { id: current.id },
      data: {
        auditChecklistItemId: optionalText(values.auditChecklistItemId),
        responsibleId: optionalText(values.responsibleId),
        title: values.title.trim(),
        description: values.description.trim(),
        severity: values.severity,
        status: values.status,
        correctionDeadline: optionalDate(values.correctionDeadline),
        correctionNotes: optionalText(values.correctionNotes),
        resolvedAt: values.status === "RESOLVED" ? new Date() : null,
      },
    });

    await tx.nonConformityChecklistItem.deleteMany({
      where: { nonConformityId: current.id },
    });

    if (linkedItemIds.length > 0) {
      await tx.nonConformityChecklistItem.createMany({
        data: linkedItemIds.map((auditChecklistItemId) => ({
          nonConformityId: current.id,
          auditChecklistItemId,
        })),
      });
    }
  });

  return true;
}

export async function resolveNonConformityForOrganization({
  id,
  organizationId,
}: {
  id: string;
  organizationId: string;
}) {
  const result = await prisma.nonConformity.updateMany({
    where: { id, audit: { organizationId } },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date(),
    },
  });

  return result.count > 0;
}

export async function countActionPlansForNonConformity({
  id,
  organizationId,
}: {
  id: string;
  organizationId: string;
}) {
  return prisma.actionPlan.count({
    where: {
      OR: [
        {
          nonConformityId: id,
          nonConformity: {
            audit: {
              organizationId,
            },
          },
        },
        {
          nonConformities: {
            some: {
              nonConformityId: id,
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
  });
}

export async function deleteNonConformityForOrganization({
  id,
  organizationId,
}: {
  id: string;
  organizationId: string;
}) {
  const result = await prisma.nonConformity.deleteMany({
    where: {
      id,
      audit: {
        organizationId,
      },
    },
  });

  return result.count > 0;
}
