import "server-only";

import { prisma } from "@/lib/prisma";

import type { AuditDocumentFormValues } from "../schemas/audit-document-schema";

function optionalText(value?: string | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

export type AuditDocumentItem = Awaited<
  ReturnType<typeof listAuditDocuments>
>[number];

export type AuditDocumentLinkOptions = Awaited<
  ReturnType<typeof getAuditDocumentLinkOptions>
>;

export async function listAuditDocuments({
  auditId,
  category,
  organizationId,
  origin,
}: {
  auditId: string;
  category?: string;
  organizationId: string;
  origin?: string;
}) {
  return prisma.auditDocument.findMany({
    where: {
      auditId,
      audit: { organizationId },
      ...(origin ? { origin: origin as never } : {}),
      ...(category ? { category } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      fileUrl: true,
      origin: true,
      createdAt: true,
      attachedBy: {
        select: {
          name: true,
          email: true,
        },
      },
      auditChecklist: {
        select: {
          id: true,
          checklistName: true,
        },
      },
      auditChecklistItem: {
        select: {
          id: true,
          question: true,
          auditChecklist: { select: { checklistName: true } },
        },
      },
      nonConformity: {
        select: {
          id: true,
          title: true,
        },
      },
      actionPlan: {
        select: {
          id: true,
          title: true,
        },
      },
      evidence: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
}

export async function listAuditDocumentCategories({
  auditId,
  organizationId,
}: {
  auditId: string;
  organizationId: string;
}) {
  const categories = await prisma.auditDocument.findMany({
    distinct: ["category"],
    where: {
      auditId,
      audit: { organizationId },
      category: { not: null },
    },
    orderBy: { category: "asc" },
    select: { category: true },
  });

  return categories
    .map((item) => item.category)
    .filter((value): value is string => Boolean(value?.trim()));
}

export async function getAuditDocumentLinkOptions({
  auditId,
  organizationId,
}: {
  auditId: string;
  organizationId: string;
}) {
  const [checklists, checklistItems, nonConformities, actionPlans, evidences] =
    await Promise.all([
      prisma.auditChecklist.findMany({
        where: { auditId, audit: { organizationId } },
        orderBy: { createdAt: "asc" },
        select: { id: true, checklistName: true },
      }),
      prisma.auditChecklistItem.findMany({
        where: { auditChecklist: { auditId, audit: { organizationId } } },
        orderBy: [{ auditChecklist: { createdAt: "asc" } }, { order: "asc" }],
        select: {
          id: true,
          question: true,
          order: true,
          auditChecklist: { select: { checklistName: true } },
        },
      }),
      prisma.nonConformity.findMany({
        where: { auditId, audit: { organizationId } },
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true },
      }),
      prisma.actionPlan.findMany({
        where: { nonConformity: { auditId, audit: { organizationId } } },
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true },
      }),
      prisma.evidence.findMany({
        where: { auditId, audit: { organizationId } },
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true },
      }),
    ]);

  return { actionPlans, checklists, checklistItems, evidences, nonConformities };
}

export async function createAuditDocumentForOrganization({
  organizationId,
  userId,
  values,
}: {
  organizationId: string;
  userId: string;
  values: AuditDocumentFormValues;
}) {
  const audit = await prisma.audit.findFirst({
    where: { id: values.auditId, organizationId },
    select: { id: true },
  });

  if (!audit) return null;

  return prisma.$transaction(async (tx) => {
    const document = await tx.auditDocument.create({
      data: {
        auditId: values.auditId,
        auditChecklistId: optionalText(values.auditChecklistId),
        auditChecklistItemId: optionalText(values.auditChecklistItemId),
        nonConformityId: optionalText(values.nonConformityId),
        actionPlanId: optionalText(values.actionPlanId),
        evidenceId: optionalText(values.evidenceId),
        attachedById: userId,
        title: values.title.trim(),
        description: optionalText(values.description),
        category: optionalText(values.category),
        fileUrl: optionalText(values.fileUrl),
        origin: values.origin,
      },
      select: { id: true, auditId: true },
    });

    await tx.auditLog.create({
      data: {
        organizationId,
        auditId: values.auditId,
        action: "DOCUMENT_CREATED",
        entity: "AUDIT_DOCUMENT",
        changes: JSON.stringify({
          documentId: document.id,
          title: values.title,
          category: optionalText(values.category),
          origin: values.origin,
        }),
      },
    });

    return document;
  });
}

export async function deleteAuditDocumentForOrganization({
  auditId,
  documentId,
  organizationId,
  userId,
}: {
  auditId: string;
  documentId: string;
  organizationId: string;
  userId: string;
}) {
  const document = await prisma.auditDocument.findFirst({
    where: { id: documentId, auditId, audit: { organizationId } },
    select: { id: true, title: true },
  });

  if (!document) return null;

  await prisma.$transaction(async (tx) => {
    await tx.auditDocument.delete({ where: { id: document.id } });
    await tx.auditLog.create({
      data: {
        organizationId,
        auditId,
        action: "DOCUMENT_DELETED",
        entity: "AUDIT_DOCUMENT",
        changes: JSON.stringify({
          documentId: document.id,
          title: document.title,
          removedById: userId,
        }),
      },
    });
  });

  return { auditId };
}
