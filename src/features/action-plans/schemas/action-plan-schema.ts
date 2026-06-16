import { z } from "zod";

export const actionPlanStatusLabels = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em andamento",
  AWAITING_REVIEW: "Em verificacao",
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

export const actionPlanExtraFieldSchema = z
  .object({
    key: z
      .string()
      .trim()
      .max(80, "O nome do campo deve ter no maximo 80 caracteres."),
    value: z
      .string()
      .trim()
      .max(240, "O valor deve ter no maximo 240 caracteres."),
  })
  .superRefine((field, context) => {
    if (field.key || field.value) {
      if (!field.key) {
        context.addIssue({
          code: "custom",
          message: "Informe o nome do campo.",
          path: ["key"],
        });
      }

      if (!field.value) {
        context.addIssue({
          code: "custom",
          message: "Informe o valor.",
          path: ["value"],
        });
      }
    }
  });

export const actionPlanSchema = z.object({
  nonConformityId: z.string().min(1, "Nao conformidade invalida."),
  responsibleId: z.string().optional(),
  title: z
    .string()
    .trim()
    .min(1, "Informe o titulo do plano.")
    .max(160, "O titulo deve ter no maximo 160 caracteres."),
  description: z
    .string()
    .trim()
    .max(2000, "A descricao deve ter no maximo 2000 caracteres.")
    .optional(),
  status: z.enum(actionPlanStatusOptions),
  priority: z.enum(actionPlanPriorityOptions),
  dueDate: z.string().optional(),
  notes: z
    .string()
    .trim()
    .max(1000, "As observacoes devem ter no maximo 1000 caracteres.")
    .optional(),
  extraFields: z.array(actionPlanExtraFieldSchema).optional(),
});

export type ActionPlanFormValues = z.infer<typeof actionPlanSchema>;
export type ActionPlanStatusValue = (typeof actionPlanStatusOptions)[number];
