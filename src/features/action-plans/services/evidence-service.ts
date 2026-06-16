import "server-only";

import { prisma } from "@/lib/prisma";

import type {
  EvidenceFormValues,
  EvidenceReviewValues,
} from "../schemas/evidence-schema";

function optionalText(value?: string | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function reviewMessage(status: EvidenceReviewValues["status"]) {
  if (status === "APPROVED") return "Evidencia aprovada.";
  if (status === "REJECTED") return "Evidencia reprovada.";

  return "Ajuste solicitado para evidencia.";
}

export async function createEvidenceForActionPlan({
  organizationId,
  userId,
  values,
}: {
  organizationId: string;
  userId: string;
  values: EvidenceFormValues;
}) {
  const actionPlan = await prisma.actionPlan.findFirst({
    where: {
      id: values.actionPlanId,
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
      status: true,
      nonConformityId: true,
      nonConformity: {
        select: {
          auditId: true,
        },
      },
    },
  });

  if (!actionPlan) {
    return null;
  }

  const nonConformityId =
    optionalText(values.nonConformityId) ?? actionPlan.nonConformityId;
  const auditChecklistItemId = optionalText(values.auditChecklistItemId);
  const shouldMoveToReview = values.origin === "EMPRESA";

  return prisma.$transaction(async (tx) => {
    const evidence = await tx.evidence.create({
      data: {
        auditId: actionPlan.nonConformity.auditId,
        actionPlanId: actionPlan.id,
        nonConformityId,
        auditChecklistItemId,
        attachedById: userId,
        title: values.title.trim(),
        description: optionalText(values.description),
        fileUrl: optionalText(values.fileUrl),
        origin: values.origin,
      },
      select: {
        id: true,
        actionPlanId: true,
        auditId: true,
        nonConformityId: true,
      },
    });

    await tx.actionPlanHistory.create({
      data: {
        actionPlanId: actionPlan.id,
        userId,
        action:
          values.origin === "EMPRESA"
            ? "Evidencia enviada pela empresa para verificacao."
            : "Evidencia anexada pela auditoria.",
      },
    });

    if (shouldMoveToReview && actionPlan.status !== "APPROVED") {
      await tx.actionPlan.update({
        where: { id: actionPlan.id },
        data: {
          status: "AWAITING_REVIEW",
          completedAt: new Date(),
        },
      });

      await tx.actionPlanHistory.create({
        data: {
          actionPlanId: actionPlan.id,
          userId,
          action: "Plano movido para verificacao apos envio de evidencia.",
        },
      });
    }

    await tx.auditLog.create({
      data: {
        organizationId,
        auditId: actionPlan.nonConformity.auditId,
        nonConformityId,
        action: "EVIDENCE_CREATED",
        entity: "EVIDENCE",
        changes: JSON.stringify({
          evidenceId: evidence.id,
          actionPlanId: actionPlan.id,
          title: values.title,
          origin: values.origin,
        }),
      },
    });

    return evidence;
  });
}

export async function reviewEvidenceForOrganization({
  organizationId,
  userId,
  values,
}: {
  organizationId: string;
  userId: string;
  values: EvidenceReviewValues;
}) {
  const evidence = await prisma.evidence.findFirst({
    where: {
      id: values.evidenceId,
      audit: {
        organizationId,
      },
    },
    select: {
      id: true,
      actionPlanId: true,
      auditId: true,
      nonConformityId: true,
      title: true,
    },
  });

  if (!evidence) {
    return null;
  }

  return prisma.$transaction(async (tx) => {
    await tx.evidence.update({
      where: { id: evidence.id },
      data: {
        status: values.status,
        reviewNotes: optionalText(values.reviewNotes),
        reviewedById: userId,
        reviewedAt: new Date(),
      },
    });

    await tx.actionPlanHistory.create({
      data: {
        actionPlanId: evidence.actionPlanId,
        userId,
        action: reviewMessage(values.status),
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId,
        auditId: evidence.auditId,
        nonConformityId: evidence.nonConformityId,
        action: "EVIDENCE_REVIEWED",
        entity: "EVIDENCE",
        changes: JSON.stringify({
          evidenceId: evidence.id,
          title: evidence.title,
          status: values.status,
          reviewNotes: optionalText(values.reviewNotes),
        }),
      },
    });

    return {
      actionPlanId: evidence.actionPlanId,
      auditId: evidence.auditId,
    };
  });
}
