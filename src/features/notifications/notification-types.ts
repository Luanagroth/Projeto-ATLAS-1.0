import type { NotificationType } from "@/generated/prisma/client";

export const notificationTypeLabels: Record<NotificationType, string> = {
  AUDIT_CREATED: "Auditoria criada",
  AUDIT_DUE_SOON: "Prazo de auditoria próximo",
  AUDIT_COMPLETED: "Auditoria finalizada",
  POSSIBLE_IRREGULARITY_CREATED: "Possível irregularidade",
  NC_CREATED: "NC criada",
  CORRECTION_SUBMITTED: "Correção enviada",
  CORRECTION_APPROVED: "Correção aprovada",
  CORRECTION_REJECTED: "Correção reprovada",
  DEADLINE_WARNING: "Aviso de prazo",
  NON_CONFORMITY_CREATED: "Não conformidade criada",
  ACTION_PLAN_CREATED: "Plano criado",
  ACTION_PLAN_DUE_SOON: "Plano próximo do vencimento",
  ACTION_PLAN_OVERDUE: "Plano vencido",
  ACTION_PLAN_COMPLETED: "Plano enviado para revisão",
  ACTION_PLAN_APPROVED: "Plano aprovado",
  ACTION_PLAN_REJECTED: "Plano reprovado",
  ACTION_PLAN_ANSWERED: "Plano respondido",
  EVIDENCE_CREATED: "Evidência anexada",
  EVIDENCE_APPROVED: "Evidência aprovada",
  EVIDENCE_REJECTED: "Evidência reprovada",
  EVIDENCE_ADJUSTMENT_REQUESTED: "Ajuste solicitado",
  OPINION_COMPLETED: "Parecer concluído",
  DOCUMENT_CREATED: "Documento anexado",
  SYSTEM: "Sistema",
};

export const notificationTypeOptions = Object.keys(
  notificationTypeLabels,
) as NotificationType[];
