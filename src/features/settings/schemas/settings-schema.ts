import { z } from "zod";

export const organizationSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome da organizacao.")
    .max(120, "O nome deve ter no maximo 120 caracteres."),
  description: z
    .string()
    .trim()
    .max(1000, "A descricao deve ter no maximo 1000 caracteres.")
    .optional(),
  cnpj: z
    .string()
    .trim()
    .max(20, "O CNPJ deve ter no maximo 20 caracteres.")
    .regex(
      /^$|^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/,
      "Informe um CNPJ valido.",
    )
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .max(40, "O telefone deve ter no maximo 40 caracteres.")
    .optional(),
  email: z
    .string()
    .trim()
    .email("Informe um email valido.")
    .max(160, "O email deve ter no maximo 160 caracteres.")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .trim()
    .max(500, "O endereco deve ter no maximo 500 caracteres.")
    .optional(),
});

export type OrganizationSettingsValues = z.infer<
  typeof organizationSettingsSchema
>;
