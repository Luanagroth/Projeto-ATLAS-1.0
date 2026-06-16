import { z } from "zod";

export const auditDocumentOriginLabels = {
  AUDITORIA: "Auditoria",
  EMPRESA: "Empresa",
  TERCEIRO: "Terceiro",
} as const;

export const auditDocumentOriginOptions = [
  "AUDITORIA",
  "EMPRESA",
  "TERCEIRO",
] as const;

export const auditDocumentSchema = z.object({
  auditId: z.string().min(1, "Auditoria invalida."),
  auditChecklistId: z.string().optional(),
  auditChecklistItemId: z.string().optional(),
  nonConformityId: z.string().optional(),
  actionPlanId: z.string().optional(),
  evidenceId: z.string().optional(),
  title: z
    .string()
    .trim()
    .min(1, "Informe o titulo do documento.")
    .max(160, "O titulo deve ter no maximo 160 caracteres."),
  description: z.string().trim().max(1000).optional(),
  category: z.string().trim().max(120).optional(),
  fileUrl: z.string().trim().max(500).optional(),
  origin: z.enum(auditDocumentOriginOptions),
});

export type AuditDocumentFormValues = z.infer<typeof auditDocumentSchema>;
