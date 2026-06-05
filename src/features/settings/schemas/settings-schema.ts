import { z } from "zod";

export const organizationSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome da organização.")
    .max(120, "O nome deve ter no máximo 120 caracteres."),
  description: z
    .string()
    .trim()
    .max(1000, "A descrição deve ter no máximo 1000 caracteres.")
    .optional(),
  logo: z
    .string()
    .trim()
    .max(500, "A URL do logo deve ter no máximo 500 caracteres.")
    .optional(),
  phone: z
    .string()
    .trim()
    .max(40, "O telefone deve ter no máximo 40 caracteres.")
    .optional(),
  email: z
    .string()
    .trim()
    .email("Informe um email valido.")
    .max(160, "O email deve ter no máximo 160 caracteres.")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .trim()
    .max(500, "O endereço deve ter no máximo 500 caracteres.")
    .optional(),
});

export type OrganizationSettingsValues = z.infer<
  typeof organizationSettingsSchema
>;
