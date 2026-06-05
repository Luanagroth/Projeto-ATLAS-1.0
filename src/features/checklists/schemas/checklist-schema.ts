import { z } from "zod";

export const checklistItemTypes = [
  "SIM_NAO",
  "TEXTO",
  "NUMERO",
  "DATA",
  "MULTIPLA_ESCOLHA",
] as const;

export const checklistItemTypeLabels: Record<
  (typeof checklistItemTypes)[number],
  string
> = {
  SIM_NAO: "Sim/Não",
  TEXTO: "Texto",
  NUMERO: "Numero",
  DATA: "Data",
  MULTIPLA_ESCOLHA: "Multipla escolha",
};

export const checklistItemSchema = z
  .object({
    question: z
      .string()
      .trim()
      .min(1, "Informe a pergunta.")
      .max(240, "A pergunta deve ter no máximo 240 caracteres."),
    type: z.enum(checklistItemTypes),
    isRequired: z.boolean(),
    options: z
      .array(
        z
          .string()
          .trim()
          .max(120, "A opção deve ter no máximo 120 caracteres."),
      )
      .optional(),
  })
  .superRefine((item, context) => {
    const options = (item.options ?? []).filter(Boolean);

    if (item.type === "MULTIPLA_ESCOLHA" && options.length < 2) {
      context.addIssue({
        code: "custom",
        message: "Informe pelo menos duas opcoes.",
        path: ["options"],
      });
    }
  });

export const checklistSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome do modelo.")
    .max(160, "O nome deve ter no máximo 160 caracteres."),
  description: z
    .string()
    .trim()
    .max(1000, "A descrição deve ter no máximo 1000 caracteres.")
    .optional(),
  category: z
    .string()
    .trim()
    .max(120, "A categoria deve ter no máximo 120 caracteres.")
    .optional(),
  isActive: z.boolean(),
  items: z
    .array(checklistItemSchema)
    .min(1, "Adicione pelo menos um item ao modelo."),
});

export type ChecklistFormValues = z.infer<typeof checklistSchema>;
export type ChecklistItemFormValues = z.infer<typeof checklistItemSchema>;
