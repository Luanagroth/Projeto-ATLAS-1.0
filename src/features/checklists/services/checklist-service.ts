import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import type { ChecklistFormValues } from "../schemas/checklist-schema";

function optionalText(value?: string | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function normalizeOptions(options?: string[]) {
  const cleaned = (options ?? [])
    .map((option) => option.trim())
    .filter(Boolean);

  return cleaned.length > 0 ? cleaned : Prisma.JsonNull;
}

function toItemData(item: ChecklistFormValues["items"][number], order: number) {
  return {
    question: item.question.trim(),
    type: item.type,
    isRequired: item.isRequired,
    order,
    options:
      item.type === "MULTIPLA_ESCOLHA"
        ? normalizeOptions(item.options)
        : Prisma.JsonNull,
  };
}

export type ChecklistListItem = Awaited<
  ReturnType<typeof listChecklistsByOrganization>
>[number];

export type ChecklistDetails = NonNullable<
  Awaited<ReturnType<typeof getChecklistByIdForOrganization>>
>;

export async function listChecklistsByOrganization(organizationId: string) {
  return prisma.checklist.findMany({
    where: {
      organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          items: true,
        },
      },
    },
  });
}

export async function getChecklistByIdForOrganization({
  checklistId,
  organizationId,
}: {
  checklistId: string;
  organizationId: string;
}) {
  return prisma.checklist.findFirst({
    where: {
      id: checklistId,
      organizationId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      version: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      items: {
        orderBy: {
          order: "asc",
        },
        select: {
          id: true,
          question: true,
          type: true,
          options: true,
          order: true,
          isRequired: true,
        },
      },
    },
  });
}

export async function createChecklistForOrganization({
  organizationId,
  values,
}: {
  organizationId: string;
  values: ChecklistFormValues;
}) {
  return prisma.checklist.create({
    data: {
      organizationId,
      name: values.name.trim(),
      description: optionalText(values.description),
      category: optionalText(values.category),
      isActive: values.isActive,
      items: {
        create: values.items.map((item, index) => toItemData(item, index + 1)),
      },
    },
    select: {
      id: true,
    },
  });
}

export async function updateChecklistForOrganization({
  checklistId,
  organizationId,
  values,
}: {
  checklistId: string;
  organizationId: string;
  values: ChecklistFormValues;
}) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.checklist.updateMany({
      where: {
        id: checklistId,
        organizationId,
      },
      data: {
        name: values.name.trim(),
        description: optionalText(values.description),
        category: optionalText(values.category),
        isActive: values.isActive,
      },
    });

    if (updated.count === 0) {
      return false;
    }

    await tx.checklistItem.deleteMany({
      where: {
        checklistId,
      },
    });

    await tx.checklistItem.createMany({
      data: values.items.map((item, index) => ({
        checklistId,
        ...toItemData(item, index + 1),
      })),
    });

    return true;
  });
}

export async function deleteChecklistForOrganization({
  checklistId,
  organizationId,
}: {
  checklistId: string;
  organizationId: string;
}) {
  const result = await prisma.checklist.deleteMany({
    where: {
      id: checklistId,
      organizationId,
    },
  });

  return result.count > 0;
}

export function isRelationConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  );
}
