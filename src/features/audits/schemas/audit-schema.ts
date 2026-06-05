import { z } from "zod";

export const auditStatuses = [
  "DRAFT",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

export const auditStatusLabels: Record<(typeof auditStatuses)[number], string> = {
  DRAFT: "Rascunho",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluida",
  CANCELLED: "Cancelada",
};

const optionalDate = z.string().optional();

export const auditSchema = z.object({
  companyId: z.string().min(1, "Selecione uma empresa."),
  title: z
    .string()
    .trim()
    .min(1, "Informe o titulo da auditoria.")
    .max(160, "O título deve ter no máximo 160 caracteres."),
  status: z.enum(auditStatuses),
  description: z
    .string()
    .trim()
    .max(1000, "A descrição deve ter no máximo 1000 caracteres.")
    .optional(),
  startDate: optionalDate,
  dueDate: optionalDate,
});

export type AuditFormValues = z.infer<typeof auditSchema>;
