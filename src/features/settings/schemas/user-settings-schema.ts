import { z } from "zod";

export const userSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .max(120, "O nome deve ter no máximo 120 caracteres.")
    .optional(),
  email: z
    .string()
    .trim()
    .min(1, "Informe o email.")
    .email("Informe um email valido.")
    .max(160, "O email deve ter no máximo 160 caracteres."),
  role: z.enum(["ADMIN", "CONSULTANT", "CLIENT"]),
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres.")
    .max(120, "A senha deve ter no máximo 120 caracteres.")
    .optional()
    .or(z.literal("")),
});

export type UserSettingsValues = z.infer<typeof userSettingsSchema>;
