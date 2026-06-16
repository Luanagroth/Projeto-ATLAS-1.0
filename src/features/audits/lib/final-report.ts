import type { AuditChecklistExecution } from "@/features/audit-checklists/services/audit-checklist-service";

import type { AuditOpinionDetails } from "../services/audit-opinion-service";
import type { AuditOperationalOverview } from "../services/audit-service";
import { auditStatusLabels, type AuditStatusValue } from "../schemas/audit-schema";

type ReportAudit = {
  company: {
    cnpj: string | null;
    name: string;
  };
  createdAt: Date;
  dueDate: Date | null;
  endDate: Date | null;
  startDate: Date | null;
  status: AuditStatusValue;
  title: string;
};

type ReportActionPlan = {
  dueDate: Date | null;
  isOverdue?: boolean;
  overdueDays?: number;
  nonConformity: {
    severity: string;
    title: string;
  };
  priority: string;
  status: string;
  title: string;
};

type ReportNonConformity = {
  _count: {
    actionPlans: number;
  };
  correctionDeadline: Date | null;
  severity: string;
  status: string;
  title: string;
};

export type AuditFinalReportInput = {
  actionPlans: ReportActionPlan[];
  appliedChecklists: AuditChecklistExecution;
  audit: ReportAudit;
  nonConformities: ReportNonConformity[];
  opinion: AuditOpinionDetails | null;
  overview: AuditOperationalOverview;
};

export function formatAuditReportDate(value: Date | null | undefined) {
  if (!value) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(value);
}

export function formatAuditReportDateTime(value: Date | null | undefined) {
  if (!value) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function auditReportUserName(
  user?: { email: string; name: string | null } | null,
) {
  return user?.name ?? user?.email ?? "Não informado";
}

function answerLabel(item: {
  answerBoolean: boolean | null;
  answerChoice: string | null;
  answerDate: Date | null;
  answerNumber: number | null;
  answerText: string | null;
}) {
  if (item.answerBoolean === true) return "Conforme";
  if (item.answerBoolean === false) return "Não conforme";
  if (item.answerText) return item.answerText;
  if (item.answerChoice) return item.answerChoice;
  if (item.answerNumber !== null && item.answerNumber !== undefined) {
    return String(item.answerNumber);
  }
  if (item.answerDate) return formatAuditReportDate(item.answerDate);

  return "Não respondido";
}

function complianceLabel(item: {
  answerBoolean: boolean | null;
  answerText: string | null;
  answerChoice: string | null;
  answerNumber: number | null;
  answerDate: Date | null;
}) {
  if (item.answerBoolean === true) return "Conforme";
  if (item.answerBoolean === false) return "Não conforme";
  if (
    item.answerText ||
    item.answerChoice ||
    item.answerNumber !== null ||
    item.answerDate
  ) {
    return "Registrado";
  }

  return "Sem resposta";
}

export function buildOpinionSummary(opinion: AuditOpinionDetails | null) {
  if (!opinion) {
    return [
      "Descrição breve da empresa: não registrada.",
      "Cuidados gerais: não registrados.",
      "Pontos positivos: não registrados.",
      "Pontos críticos: não registrados.",
      "Performance geral: não registrada.",
      "Riscos identificados: não registrados.",
      "Recomendações: não registradas.",
    ];
  }

  return [
    `Descrição breve da empresa: ${opinion.companyBrief ?? "Não registrada."}`,
    `Cuidados gerais: ${opinion.generalCare ?? "Não registrados."}`,
    `Pontos positivos: ${opinion.positivePoints ?? "Não registrados."}`,
    `Pontos críticos: ${opinion.criticalPoints ?? "Não registrados."}`,
    `Performance geral: ${opinion.overallPerformance ?? "Não registrada."}`,
    `Riscos identificados: ${opinion.identifiedRisks ?? "Não registrados."}`,
    `Recomendações: ${opinion.recommendations ?? "Não registradas."}`,
  ];
}

function buildChecklistSection(appliedChecklists: AuditChecklistExecution) {
  if (appliedChecklists.length === 0) {
    return ["CHECKLISTS", "Nenhum checklist aplicado ainda."];
  }

  const lines: string[] = ["CHECKLISTS E RESPOSTAS"];

  for (const checklist of appliedChecklists) {
    lines.push("");
    lines.push(`Checklist: ${checklist.checklistName}`);
    lines.push(`Categoria: ${checklist.checklistCategory ?? "Não informada"}`);
    lines.push(`Status: ${checklist.status}`);
      lines.push(`Nota da auditora: ${checklist.auditorNote ?? "Sem nota registrada."}`);
      lines.push(
        `Visibilidade da nota: ${checklist.auditorNoteVisibility === "SHARED" ? "Pública" : "Interna"}`,
      );

    for (const item of checklist.items) {
      const response = item.responses[0];
      lines.push("");
      lines.push(`- Item ${item.order}: ${item.question}`);
      if (item.description) {
        lines.push(`  Descrição: ${item.description}`);
      }
      lines.push(
        `  Conformidade: ${response ? complianceLabel(response) : "Sem resposta"}`,
      );
      lines.push(`  Resposta: ${response ? answerLabel(response) : "Não respondido"}`);

      if (response?.notes) {
        lines.push(`  Observação: ${response.notes}`);
      }

      if (response?.evidence) {
        lines.push(`  Evidência: ${response.evidence}`);
      }

      if (response?.updatedAt) {
        lines.push(`  Atualizado em: ${formatAuditReportDateTime(response.updatedAt)}`);
      }

      if (response?.respondent) {
        lines.push(`  Respondente: ${auditReportUserName(response.respondent)}`);
      }

      if (response?.updatedBy) {
        lines.push(`  Atualizado por: ${auditReportUserName(response.updatedBy)}`);
      }

      if (item.nonConformities.length > 0) {
        lines.push(
          `  NC vinculadas: ${item.nonConformities.map((nc) => nc.title).join(" | ")}`,
        );
      }
    }
  }

  return lines;
}

export function buildAuditFinalReport({
  actionPlans,
  appliedChecklists,
  nonConformities,
  opinion,
  overview,
  audit,
}: AuditFinalReportInput) {
  const completedAt = audit.endDate
    ? formatAuditReportDateTime(audit.endDate)
    : "Pendente de selagem";
  const checklistSection = buildChecklistSection(appliedChecklists);
  const opinionSummary = buildOpinionSummary(opinion);

  const keySummary = [
    `Checklist aplicado(s): ${overview.checklistsApplied}`,
    `Itens conformes: ${overview.conformingItems}`,
    `Itens não conformes: ${overview.nonConformingItems}`,
    `NCs abertas: ${overview.ncsOpen}`,
    `Planos aguardando resposta: ${overview.plansAwaitingResponse}`,
    `Planos em verificação: ${overview.plansInVerification}`,
    `Evidências pendentes: ${overview.pendingEvidences}`,
    `Documentos vinculados: ${overview.documentsCount}`,
  ];

  const topNc = nonConformities.length
    ? nonConformities.map((item, index) => {
        const planInfo =
          item._count.actionPlans > 0
            ? `${item._count.actionPlans} plano(s)`
            : "sem plano";
        const deadline = item.correctionDeadline
          ? `prazo ${formatAuditReportDate(item.correctionDeadline)}`
          : "sem prazo definido";

        return `${index + 1}. ${item.title} (${item.severity}) - ${item.status} - ${planInfo} - ${deadline}`;
      })
    : ["Nenhuma NC registrada."];

  const topPlans = actionPlans.length
    ? actionPlans.map((item, index) => {
        const overdue =
          item.isOverdue && item.overdueDays
            ? ` - atrasado ha ${item.overdueDays} dia(s)`
            : "";

        return `${index + 1}. ${item.title} - ${item.status} - ${item.priority} - origem: ${item.nonConformity.title}${overdue}`;
      })
    : ["Nenhum plano de ação registrado."];

  return [
    "RELATORIO FINAL DA AUDITORIA",
    "",
    `Empresa: ${audit.company.name}`,
    `Documento: ${audit.company.cnpj ?? "Não informado"}`,
    `Auditoria: ${audit.title}`,
    `Status: ${auditStatusLabels[audit.status]}`,
    `Data de criação: ${formatAuditReportDateTime(audit.createdAt)}`,
    `Início: ${formatAuditReportDate(audit.startDate)}`,
    `Prazo: ${formatAuditReportDate(audit.dueDate)}`,
    `Selagem: ${completedAt}`,
    "",
    "RESUMO OPERACIONAL",
    ...keySummary.map((line) => `- ${line}`),
    "",
    "PONTOS FORTES E PONTOS DE ATENÇÃO",
    ...opinionSummary.map((line) => `- ${line}`),
    "",
    "NÃO CONFORMIDADES PRINCIPAIS",
    ...topNc.map((line) => `- ${line}`),
    "",
    "PLANOS DE AÇÃO",
    ...topPlans.map((line) => `- ${line}`),
    "",
    ...checklistSection,
    "",
    "CONCLUSAO",
    audit.status === "COMPLETED"
      ? "A auditoria foi selada e segue para consulta, rastreabilidade e revisão posterior."
      : "A auditoria ainda aguarda selagem final pela auditora.",
  ].join("\n");
}
