import { z } from "zod";

import { checklistItemTypes } from "@/features/checklists/schemas/checklist-schema";

export const applyChecklistSchema = z.object({
  auditId: z.string().min(1, "Auditoria invalida."),
  checklistId: z.string().min(1, "Selecione um modelo de checklist."),
});

export const checklistResponseSchema = z.object({
  auditChecklistItemId: z.string().min(1),
  type: z.enum(checklistItemTypes),
  answerValue: z.string().optional(),
  isCompliant: z.enum(["true", "false"]).optional(),
  evidence: z
    .string()
    .trim()
    .max(500, "O anexo/link deve ter no maximo 500 caracteres.")
    .optional(),
  notes: z
    .string()
    .trim()
    .max(1000, "A observacao deve ter no maximo 1000 caracteres.")
    .optional(),
});

export const saveChecklistResponsesSchema = z.object({
  auditId: z.string().min(1, "Auditoria invalida."),
  auditChecklistId: z.string().min(1, "Checklist invalido."),
  auditorNote: z
    .string()
    .trim()
    .max(2000, "A nota da auditora deve ter no maximo 2000 caracteres.")
    .optional(),
  auditorNoteVisibility: z.enum(["INTERNAL", "SHARED"]).default("INTERNAL"),
  responses: z.array(checklistResponseSchema),
});

export type ApplyChecklistValues = z.infer<typeof applyChecklistSchema>;
export type ChecklistResponseValues = z.infer<typeof checklistResponseSchema>;
export type SaveChecklistResponsesValues = z.infer<
  typeof saveChecklistResponsesSchema
>;
