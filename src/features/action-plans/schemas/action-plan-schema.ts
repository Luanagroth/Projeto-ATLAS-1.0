import { z } from "zod";

export const actionPlanStatusLabels = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em andamento",
  AWAITING_REVIEW: "Aguardando revisao",
  APPROVED: "Aprovado",
  REJECTED: "Reprovado",
} as const;

export const actionPlanPriorityLabels = {
  LOW: "Baixa",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Critica",
} as const;

export const actionPlanStatusOptions = [
  "OPEN",
  "IN_PROGRESS",
  "AWAITING_REVIEW",
  "APPROVED",
  "REJECTED",
] as const;

export const actionPlanPriorityOptions = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const;

export const actionPlanSchema = z.object({
  nonConformityId: z.string().min(1, "Não conformidade inválida."),
  responsibleId: z.string().optional(),
  title: z
    .string()
    .trim()
    .min(1, "Informe o titulo do plano.")
    .max(160, "O título deve ter no máximo 160 caracteres."),
  description: z
    .string()
    .trim()
    .max(2000, "A descrição deve ter no máximo 2000 caracteres.")
    .optional(),
  status: z.enum(actionPlanStatusOptions),
  priority: z.enum(actionPlanPriorityOptions),
  dueDate: z.string().optional(),
  notes: z
    .string()
    .trim()
    .max(1000, "As observações devem ter no máximo 1000 caracteres.")
    .optional(),
});

export type ActionPlanFormValues = z.infer<typeof actionPlanSchema>;
export type ActionPlanStatusValue = (typeof actionPlanStatusOptions)[number];
