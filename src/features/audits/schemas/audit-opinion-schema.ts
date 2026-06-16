import { z } from "zod";

export const auditOpinionStatusLabels = {
  DRAFT: "Rascunho",
  COMPLETED: "Concluido",
} as const;

export const auditOpinionStatusOptions = ["DRAFT", "COMPLETED"] as const;

export const auditOpinionSchema = z.object({
  auditId: z.string().min(1, "Auditoria invalida."),
  companyBrief: z.string().trim().max(2000).optional(),
  generalCare: z.string().trim().max(2000).optional(),
  positivePoints: z.string().trim().max(2000).optional(),
  criticalPoints: z.string().trim().max(2000).optional(),
  overallPerformance: z.string().trim().max(2000).optional(),
  identifiedRisks: z.string().trim().max(2000).optional(),
  recommendations: z.string().trim().max(2000).optional(),
  finalOpinion: z.string().trim().max(20000).optional(),
  status: z.enum(auditOpinionStatusOptions),
});

export type AuditOpinionFormValues = z.infer<typeof auditOpinionSchema>;
export type AuditOpinionStatusValue =
  (typeof auditOpinionStatusOptions)[number];
