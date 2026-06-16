import { z } from "zod";

export const evidenceOriginLabels = {
  AUDITORIA: "Auditoria",
  EMPRESA: "Empresa auditada",
} as const;

export const evidenceStatusLabels = {
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Reprovada",
  ADJUSTMENT_REQUESTED: "Ajuste solicitado",
} as const;

export const evidenceOriginOptions = ["AUDITORIA", "EMPRESA"] as const;

export const evidenceStatusOptions = [
  "APPROVED",
  "REJECTED",
  "ADJUSTMENT_REQUESTED",
] as const;

export const evidenceSchema = z.object({
  actionPlanId: z.string().min(1, "Plano de acao invalido."),
  nonConformityId: z.string().optional(),
  auditChecklistItemId: z.string().optional(),
  title: z
    .string()
    .trim()
    .min(1, "Informe o titulo da evidencia.")
    .max(160, "O titulo deve ter no maximo 160 caracteres."),
  description: z
    .string()
    .trim()
    .max(1000, "A descricao deve ter no maximo 1000 caracteres.")
    .optional(),
  fileUrl: z
    .string()
    .trim()
    .max(500, "O link deve ter no maximo 500 caracteres.")
    .optional(),
  origin: z.enum(evidenceOriginOptions),
});

export const evidenceReviewSchema = z.object({
  evidenceId: z.string().min(1, "Evidencia invalida."),
  status: z.enum(evidenceStatusOptions),
  reviewNotes: z
    .string()
    .trim()
    .max(1000, "A observacao deve ter no maximo 1000 caracteres.")
    .optional(),
});

export type EvidenceFormValues = z.infer<typeof evidenceSchema>;
export type EvidenceReviewValues = z.infer<typeof evidenceReviewSchema>;
export type EvidenceStatusValue = keyof typeof evidenceStatusLabels;
