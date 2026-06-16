import "server-only";

import { prisma } from "@/lib/prisma";

import type { AuditOpinionFormValues } from "../schemas/audit-opinion-schema";

function optionalText(value?: string | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function opinionData(values: AuditOpinionFormValues) {
  return {
    companyBrief: optionalText(values.companyBrief),
    generalCare: optionalText(values.generalCare),
    positivePoints: optionalText(values.positivePoints),
    criticalPoints: optionalText(values.criticalPoints),
    overallPerformance: optionalText(values.overallPerformance),
    identifiedRisks: optionalText(values.identifiedRisks),
    recommendations: optionalText(values.recommendations),
    finalOpinion: optionalText(values.finalOpinion),
    status: values.status,
  };
}

export type AuditOpinionDetails = NonNullable<
  Awaited<ReturnType<typeof getAuditOpinionForAudit>>
>;

export async function getAuditOpinionForAudit({
  auditId,
  organizationId,
}: {
  auditId: string;
  organizationId: string;
}) {
  return prisma.auditOpinion.findFirst({
    where: {
      auditId,
      audit: { organizationId },
    },
    select: {
      id: true,
      auditId: true,
      companyBrief: true,
      generalCare: true,
      positivePoints: true,
      criticalPoints: true,
      overallPerformance: true,
      identifiedRisks: true,
      recommendations: true,
      finalOpinion: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      responsible: {
        select: {
          name: true,
          email: true,
        },
      },
      history: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          action: true,
          changes: true,
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

export async function upsertAuditOpinionForOrganization({
  organizationId,
  userId,
  values,
}: {
  organizationId: string;
  userId: string;
  values: AuditOpinionFormValues;
}) {
  const audit = await prisma.audit.findFirst({
    where: { id: values.auditId, organizationId },
    select: { id: true },
  });

  if (!audit) return null;

  const existing = await prisma.auditOpinion.findUnique({
    where: { auditId: values.auditId },
    select: { id: true, status: true },
  });
  const data = opinionData(values);
  const action = !existing
    ? "OPINION_CREATED"
    : existing.status !== "COMPLETED" && values.status === "COMPLETED"
      ? "OPINION_COMPLETED"
      : "OPINION_UPDATED";

  return prisma.$transaction(async (tx) => {
    const opinion = await tx.auditOpinion.upsert({
      where: { auditId: values.auditId },
      create: {
        auditId: values.auditId,
        responsibleId: userId,
        ...data,
      },
      update: {
        responsibleId: userId,
        ...data,
      },
      select: { id: true, auditId: true, status: true },
    });

    await tx.auditOpinionHistory.create({
      data: {
        auditOpinionId: opinion.id,
        userId,
        action,
        changes: JSON.stringify({ status: values.status }),
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId,
        auditId: values.auditId,
        action,
        entity: "AUDIT_OPINION",
        changes: JSON.stringify({ status: values.status }),
      },
    });

    return opinion;
  });
}
