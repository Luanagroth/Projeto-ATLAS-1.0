import { z } from "zod";

export const auditStatuses = [
  "DRAFT",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

export type AuditStatusValue = (typeof auditStatuses)[number];

export const auditStatusLabels: Record<AuditStatusValue, string> = {
  DRAFT: "Em andamento",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Finalizada",
  CANCELLED: "Cancelada",
};

/** Transições de status permitidas por role ADMIN/CONSULTANT */
export const auditStatusTransitions: Record<AuditStatusValue, AuditStatusValue[]> = {
  DRAFT: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: ["IN_PROGRESS"], // Reabrir se precisar
  CANCELLED: [],
};

export const auditStatusActionLabels: Record<string, string> = {
  "DRAFT->IN_PROGRESS": "Iniciar auditoria",
  "DRAFT->CANCELLED": "Cancelar auditoria",
  "IN_PROGRESS->COMPLETED": "Concluir auditoria",
  "IN_PROGRESS->CANCELLED": "Cancelar auditoria",
  "COMPLETED->IN_PROGRESS": "Reabrir auditoria",
};

/** Estados em que operações de escrita são permitidas */
export const auditEditableStatuses: AuditStatusValue[] = ["DRAFT", "IN_PROGRESS"];

/** Estados em que a auditoria é somente leitura */
export const auditReadOnlyStatuses: AuditStatusValue[] = ["COMPLETED", "CANCELLED"];

export function isAuditEditable(status: AuditStatusValue): boolean {
  return auditEditableStatuses.includes(status);
}

export function isAuditReadOnly(status: AuditStatusValue): boolean {
  return auditReadOnlyStatuses.includes(status);
}

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

export const updateAuditStatusSchema = z.object({
  auditId: z.string().min(1),
  status: z.enum(auditStatuses),
});

export type AuditFormValues = z.infer<typeof auditSchema>;
export type UpdateAuditStatusValues = z.infer<typeof updateAuditStatusSchema>;
