import { z } from "zod";

import { checklistItemTypes } from "@/features/checklists/schemas/checklist-schema";

export const applyChecklistSchema = z.object({
  auditId: z.string().min(1, "Auditoria inválida."),
  checklistId: z.string().min(1, "Selecione um modelo de checklist."),
});

export const checklistResponseSchema = z.object({
  auditChecklistItemId: z.string().min(1),
  type: z.enum(checklistItemTypes),
  answerValue: z.string().optional(),
  notes: z.string().trim().max(1000, "A observação deve ter no máximo 1000 caracteres.").optional(),
});

export const saveChecklistResponsesSchema = z.object({
  auditId: z.string().min(1, "Auditoria inválida."),
  auditChecklistId: z.string().min(1, "Checklist invalido."),
  responses: z.array(checklistResponseSchema),
});

export type ApplyChecklistValues = z.infer<typeof applyChecklistSchema>;
export type ChecklistResponseValues = z.infer<typeof checklistResponseSchema>;
export type SaveChecklistResponsesValues = z.infer<
  typeof saveChecklistResponsesSchema
>;
