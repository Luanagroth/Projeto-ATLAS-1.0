import "server-only";

import type { ActionPlanStatus, AuditStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const openPlanStatuses: ActionPlanStatus[] = ["OPEN", "IN_PROGRESS", "REJECTED"];
const activeAuditStatuses: AuditStatus[] = ["DRAFT", "IN_PROGRESS"];

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addMonths(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function daysBetween(start?: Date | null, end?: Date | null) {
  if (!start || !end) return null;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86_400_000));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function severityLabel(value: string) {
  return (
    {
      LOW: "Baixa",
      MEDIUM: "Media",
      HIGH: "Alta",
      CRITICAL: "Critica",
    }[value] ?? value
  );
}

function auditStatusLabel(value: string) {
  return (
    {
      DRAFT: "Em andamento",
      IN_PROGRESS: "Em andamento",
      COMPLETED: "Finalizada",
      CANCELLED: "Finalizada",
    }[value] ?? value
  );
}

function planStatusLabel(value: string) {
  return (
    {
      OPEN: "Aberto",
      IN_PROGRESS: "Em andamento",
      AWAITING_REVIEW: "Em verificacao",
      APPROVED: "Aprovado",
      REJECTED: "Reprovado",
    }[value] ?? value
  );
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

function createEmptyDashboardData() {
  return {
    cards: {
      companiesTotal: 0,
      auditsThisMonth: 0,
      auditsLast60Days: 0,
      companiesAuditedThisMonth: 0,
      companiesAuditedLast60Days: 0,
      auditsCompletedThisMonth: 0,
      auditsCompletedLast60Days: 0,
      auditsInProgress: 0,
      auditsDraft: 0,
      auditsCompleted: 0,
      auditsCancelled: 0,
      ncOpen: 0,
      plansOpen: 0,
      plansAwaitingResponse: 0,
      plansInVerification: 0,
      plansOverdue: 0,
      evidencesPending: 0,
      opinionsPending: 0,
      documentsTotal: 0,
    },
    charts: {
      auditsByStatus: [] as { label: string; value: number }[],
      auditsByMonth: [] as { label: string; value: number }[],
      ncsBySeverity: [] as { label: string; value: number }[],
      plansByStatus: [] as { label: string; value: number }[],
      companiesAuditedByPeriod: [] as { label: string; value: number }[],
    },
    summaries: {
      conformityRate: 0,
      averageNcsPerAudit: 0,
      averageAuditClosingDays: 0,
      companiesAudited: 0,
    },
    attention: {
      plansOverdue: [] as {
        id: string;
        title: string;
        dueDate: Date | null;
        nonConformity: { audit: { id: string; company: { name: string } } };
      }[],
      plansDueSoon: [] as {
        id: string;
        title: string;
        dueDate: Date | null;
        nonConformity: { audit: { id: string; company: { name: string } } };
      }[],
      evidencesPending: [] as {
        id: string;
        title: string;
        actionPlanId: string;
        createdAt: Date;
        audit: { id: string; company: { name: string } };
      }[],
      plansInVerification: [] as {
        id: string;
        title: string;
        updatedAt: Date;
        nonConformity: { audit: { id: string; company: { name: string } } };
      }[],
      auditsWithoutOpinion: [] as {
        id: string;
        title: string;
        dueDate: Date | null;
        company: { name: string };
      }[],
      possibleIrregularities: [] as {
        auditId: string;
        updatedAt: Date;
        auditChecklistItem: {
          question: string;
          auditChecklist: { audit: { id: string; company: { name: string } } };
        };
      }[],
    },
  };
}

async function loadDashboardData(organizationId: string) {
  const now = new Date();
  const dueSoon = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7);
  const monthStart = startOfMonth(now);
  const firstMonth = addMonths(monthStart, -11);
  const last60DaysStart = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 60);

  const [
    companiesTotal,
    auditsThisMonth,
    auditsLast60Days,
    companiesAuditedThisMonth,
    companiesAuditedLast60Days,
    auditsCompletedThisMonth,
    auditsCompletedLast60Days,
    auditsByStatus,
    ncOpen,
    plansOpen,
    plansAwaitingResponse,
    plansInVerification,
    plansOverdue,
    evidencesPending,
    opinionsCompleted,
    documentsTotal,
    ncBySeverity,
    plansByStatus,
    auditsForMonths,
    conformityResponses,
    completedAudits,
    auditsWithNcCount,
    auditedCompanies,
    attentionPlansOverdue,
    attentionPlansDueSoon,
    attentionEvidences,
    attentionPlansVerification,
    attentionAuditsWithoutOpinion,
    attentionPossibleIrregularities,
  ] = await Promise.all([
    prisma.company.count({ where: { organizationId } }),
    prisma.audit.count({
      where: { organizationId, createdAt: { gte: monthStart } },
    }),
    prisma.audit.count({
      where: { organizationId, createdAt: { gte: last60DaysStart } },
    }),
    prisma.audit.findMany({
      where: { organizationId, createdAt: { gte: monthStart } },
      distinct: ["companyId"],
      select: { companyId: true },
    }),
    prisma.audit.findMany({
      where: { organizationId, createdAt: { gte: last60DaysStart } },
      distinct: ["companyId"],
      select: { companyId: true },
    }),
    prisma.audit.count({
      where: {
        organizationId,
        status: "COMPLETED",
        endDate: { gte: monthStart },
      },
    }),
    prisma.audit.count({
      where: {
        organizationId,
        status: "COMPLETED",
        endDate: { gte: last60DaysStart },
      },
    }),
    prisma.audit.groupBy({
      by: ["status"],
      where: { organizationId },
      _count: { _all: true },
    }),
    prisma.nonConformity.count({
      where: { audit: { organizationId }, status: { not: "RESOLVED" } },
    }),
    prisma.actionPlan.count({
      where: {
        nonConformity: { audit: { organizationId } },
        status: { in: ["OPEN", "IN_PROGRESS", "AWAITING_REVIEW", "REJECTED"] },
      },
    }),
    prisma.actionPlan.count({
      where: {
        nonConformity: { audit: { organizationId } },
        status: { in: openPlanStatuses },
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
        status: { in: ["OPEN", "IN_PROGRESS", "AWAITING_REVIEW", "REJECTED"] },
        dueDate: { lt: now },
      },
    }),
    prisma.evidence.count({
      where: { audit: { organizationId }, status: "PENDING" },
    }),
    prisma.auditOpinion.count({
      where: { audit: { organizationId }, status: "COMPLETED" },
    }),
    prisma.auditDocument.count({ where: { audit: { organizationId } } }),
    prisma.nonConformity.groupBy({
      by: ["severity"],
      where: { audit: { organizationId } },
      _count: { _all: true },
    }),
    prisma.actionPlan.groupBy({
      by: ["status"],
      where: { nonConformity: { audit: { organizationId } } },
      _count: { _all: true },
    }),
    prisma.audit.findMany({
      where: { organizationId, createdAt: { gte: firstMonth } },
      select: { createdAt: true, companyId: true },
    }),
    prisma.checklistResponse.findMany({
      where: {
        audit: { organizationId },
        answerBoolean: { not: null },
      },
      select: { answerBoolean: true },
    }),
    prisma.audit.findMany({
      where: { organizationId, status: "COMPLETED" },
      select: { startDate: true, endDate: true, createdAt: true, updatedAt: true },
    }),
    prisma.audit.findMany({
      where: { organizationId },
      select: { id: true, _count: { select: { nonConformities: true } } },
    }),
    prisma.audit.findMany({
      where: { organizationId, status: { in: ["IN_PROGRESS", "COMPLETED"] } },
      distinct: ["companyId"],
      select: { companyId: true },
    }),
    prisma.actionPlan.findMany({
      where: {
        nonConformity: { audit: { organizationId } },
        status: { in: ["OPEN", "IN_PROGRESS", "AWAITING_REVIEW", "REJECTED"] },
        dueDate: { lt: now },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: {
        id: true,
        title: true,
        dueDate: true,
        nonConformity: {
          select: { audit: { select: { id: true, company: { select: { name: true } } } } },
        },
      },
    }),
    prisma.actionPlan.findMany({
      where: {
        nonConformity: { audit: { organizationId } },
        status: { in: openPlanStatuses },
        dueDate: { gte: now, lte: dueSoon },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: {
        id: true,
        title: true,
        dueDate: true,
        nonConformity: {
          select: { audit: { select: { id: true, company: { select: { name: true } } } } },
        },
      },
    }),
    prisma.evidence.findMany({
      where: { audit: { organizationId }, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        actionPlanId: true,
        createdAt: true,
        audit: { select: { id: true, company: { select: { name: true } } } },
      },
    }),
    prisma.actionPlan.findMany({
      where: {
        nonConformity: { audit: { organizationId } },
        status: "AWAITING_REVIEW",
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        updatedAt: true,
        nonConformity: {
          select: { audit: { select: { id: true, company: { select: { name: true } } } } },
        },
      },
    }),
    prisma.audit.findMany({
      where: {
        organizationId,
        status: { in: activeAuditStatuses },
        dueDate: { gte: now, lte: dueSoon },
        OR: [{ opinion: null }, { opinion: { status: "DRAFT" } }],
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: {
        id: true,
        title: true,
        dueDate: true,
        company: { select: { name: true } },
      },
    }),
    prisma.checklistResponse.findMany({
      where: {
        audit: { organizationId },
        answerBoolean: false,
        auditChecklistItem: {
          nonConformities: { none: {} },
          nonConformityLinks: { none: {} },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        auditId: true,
        updatedAt: true,
        auditChecklistItem: {
          select: {
            question: true,
            auditChecklist: {
              select: {
                audit: { select: { id: true, company: { select: { name: true } } } },
              },
            },
          },
        },
      },
    }),
  ]);

  const auditStatusCounts = Object.fromEntries(
    auditsByStatus.map((item) => [item.status, item._count._all]),
  );
  const totalAudits = auditsByStatus.reduce((sum, item) => sum + item._count._all, 0);
  const completedCount = auditStatusCounts.COMPLETED ?? 0;

  const monthKeys = Array.from({ length: 12 }, (_, index) =>
    monthKey(addMonths(firstMonth, index)),
  );
  const auditsByMonthMap = new Map(monthKeys.map((key) => [key, 0]));
  const companiesByMonth = new Map(monthKeys.map((key) => [key, new Set<string>()]));

  for (const audit of auditsForMonths) {
    const key = monthKey(audit.createdAt);
    auditsByMonthMap.set(key, (auditsByMonthMap.get(key) ?? 0) + 1);
    companiesByMonth.get(key)?.add(audit.companyId);
  }

  const compliant = conformityResponses.filter((item) => item.answerBoolean).length;
  const conformityRate =
    conformityResponses.length === 0 ? 0 : (compliant / conformityResponses.length) * 100;

  const closingDays = completedAudits
    .map((audit) => daysBetween(audit.startDate ?? audit.createdAt, audit.endDate ?? audit.updatedAt))
    .filter((value): value is number => value !== null);

  const avgNcs = average(auditsWithNcCount.map((audit) => audit._count.nonConformities));
  const pendingOpinions = Math.max(totalAudits - completedCount - opinionsCompleted, 0);

  return {
    cards: {
      companiesTotal,
      auditsThisMonth,
      auditsLast60Days,
      companiesAuditedThisMonth: companiesAuditedThisMonth.length,
      companiesAuditedLast60Days: companiesAuditedLast60Days.length,
      auditsCompletedThisMonth,
      auditsCompletedLast60Days,
      auditsInProgress: auditStatusCounts.IN_PROGRESS ?? 0,
      auditsDraft: auditStatusCounts.DRAFT ?? 0,
      auditsCompleted: completedCount,
      auditsCancelled: auditStatusCounts.CANCELLED ?? 0,
      ncOpen,
      plansOpen,
      plansAwaitingResponse,
      plansInVerification,
      plansOverdue,
      evidencesPending,
      opinionsPending: pendingOpinions,
      documentsTotal,
    },
    charts: {
      auditsByStatus: auditsByStatus.map((item) => ({
        label: auditStatusLabel(item.status),
        value: item._count._all,
      })),
      auditsByMonth: monthKeys.map((key) => ({
        label: monthLabel(key),
        value: auditsByMonthMap.get(key) ?? 0,
      })),
      ncsBySeverity: ncBySeverity.map((item) => ({
        label: severityLabel(item.severity),
        value: item._count._all,
      })),
      plansByStatus: plansByStatus.map((item) => ({
        label: planStatusLabel(item.status),
        value: item._count._all,
      })),
      companiesAuditedByPeriod: monthKeys.map((key) => ({
        label: monthLabel(key),
        value: companiesByMonth.get(key)?.size ?? 0,
      })),
    },
    summaries: {
      conformityRate,
      averageNcsPerAudit: avgNcs,
      averageAuditClosingDays: average(closingDays),
      companiesAudited: auditedCompanies.length,
    },
    attention: {
      plansOverdue: attentionPlansOverdue,
      plansDueSoon: attentionPlansDueSoon,
      evidencesPending: attentionEvidences,
      plansInVerification: attentionPlansVerification,
      auditsWithoutOpinion: attentionAuditsWithoutOpinion,
      possibleIrregularities: attentionPossibleIrregularities,
    },
  };
}

export async function getDashboardData(organizationId: string) {
  try {
    return await Promise.race([
      loadDashboardData(organizationId),
      new Promise<ReturnType<typeof createEmptyDashboardData>>((resolve) => {
        setTimeout(() => resolve(createEmptyDashboardData()), 3500);
      }),
    ]);
  } catch (error) {
    console.error("Failed to load dashboard data", error);
    return createEmptyDashboardData();
  }
}
