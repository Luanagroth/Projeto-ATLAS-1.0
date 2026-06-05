import { z } from "zod";

export const severityLabels = {
  LOW: "Baixa",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Critica",
} as const;

export const statusLabels = {
  OPEN: "Aberta",
  IN_PROGRESS: "Em andamento",
  RESOLVED: "Resolvida",
} as const;

export const severityOptions = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const statusOptions = ["OPEN", "IN_PROGRESS", "RESOLVED"] as const;

export const nonConformitySchema = z.object({
  auditId: z.string().min(1, "Auditoria inválida."),
  auditChecklistItemId: z.string().optional(),
  responsibleId: z.string().optional(),
  title: z
    .string()
    .trim()
    .min(1, "Informe o título da não conformidade.")
    .max(160, "O título deve ter no máximo 160 caracteres."),
  description: z
    .string()
    .trim()
    .min(1, "Informe a descricao.")
    .max(2000, "A descrição deve ter no máximo 2000 caracteres."),
  severity: z.enum(severityOptions),
  status: z.enum(statusOptions),
  correctionDeadline: z.string().optional(),
  correctionNotes: z
    .string()
    .trim()
    .max(1000, "As observações devem ter no máximo 1000 caracteres.")
    .optional(),
});

export type NonConformityFormValues = z.infer<typeof nonConformitySchema>;
