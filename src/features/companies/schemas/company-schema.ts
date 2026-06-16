import { z } from "zod";

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).optional();

const optionalEmail = z
  .string()
  .trim()
  .refine((value) => !value || z.email().safeParse(value).success, {
    message: "Informe um email valido.",
  })
  .optional();

const documentTypeOptions = ["CNPJ", "CPF", "MEI", "OUTRO"] as const;
const legalTypeOptions = ["MEI", "ME", "EPP", "LTDA", "SA", "OUTRO"] as const;
const companySegmentOptions = [
  "Industria",
  "Comercio",
  "Servicos",
  "Saude",
  "Educacao",
  "Tecnologia",
  "Logistica",
  "Construcao Civil",
  "Agroindustria",
  "Alimentos e Bebidas",
  "Financeiro",
  "Energia",
  "Outro",
] as const;

const digitsOnly = (value?: string) => value?.replace(/\D/g, "") ?? "";

const optionalDigits = (max: number, message: string) =>
  z
    .string()
    .trim()
    .refine((value) => !value || digitsOnly(value).length <= max, { message })
    .transform((value) => digitsOnly(value))
    .optional();

const optionalPositiveInteger = z.preprocess(
  (value) => {
    if (value === "" || value === null || typeof value === "undefined") {
      return undefined;
    }

    if (typeof value === "string") {
      return Number(value);
    }

    return value;
  },
  z
    .number()
    .int("Informe um numero inteiro.")
    .min(0, "Informe um numero maior ou igual a zero.")
    .optional(),
);

export const extraFieldSchema = z
  .object({
    key: z
      .string()
      .trim()
      .max(80, "O nome do campo deve ter no máximo 80 caracteres."),
    value: z
      .string()
      .trim()
      .max(240, "O valor deve ter no máximo 240 caracteres."),
  })
  .superRefine((field, context) => {
    if (field.key || field.value) {
      if (!field.key) {
        context.addIssue({
          code: "custom",
          message: "Informe o nome do campo.",
          path: ["key"],
        });
      }

      if (!field.value) {
        context.addIssue({
          code: "custom",
          message: "Informe o valor.",
          path: ["value"],
        });
      }
    }
  });

export const companySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Informe o nome da empresa.")
      .max(120, "O nome deve ter no máximo 120 caracteres."),
    cnpj: optionalDigits(14, "Informe no máximo 14 dígitos."),
    description: optionalText(
      500,
      "A descrição deve ter no máximo 500 caracteres.",
    ),
    address: optionalText(240, "O endereço deve ter no máximo 240 caracteres."),
    tradeName: optionalText(
      120,
      "O nome fantasia deve ter no máximo 120 caracteres.",
    ),
    legalName: optionalText(
      160,
      "A razão social deve ter no máximo 160 caracteres.",
    ),
    documentType: z.enum(documentTypeOptions).optional().or(z.literal("")),
    legalType: z.enum(legalTypeOptions).optional().or(z.literal("")),
    segment: optionalText(
      120,
      "O ramo de atuação deve ter no máximo 120 caracteres.",
    ),
    employeeCount: optionalPositiveInteger,
    responsibleName: optionalText(
      120,
      "O nome do responsável deve ter no máximo 120 caracteres.",
    ),
    responsibleRole: optionalText(
      80,
      "O cargo do responsável deve ter no máximo 80 caracteres.",
    ),
    email: optionalEmail,
    phone: optionalDigits(11, "Informe no máximo 11 dígitos."),
    zipCode: optionalDigits(8, "Informe no máximo 8 dígitos."),
    city: optionalText(80, "A cidade deve ter no máximo 80 caracteres."),
    state: optionalText(40, "O estado deve ter no máximo 40 caracteres."),
    country: optionalText(80, "O país deve ter no máximo 80 caracteres."),
    notes: optionalText(1000, "As observações devem ter no máximo 1000 caracteres."),
    extraFields: z.array(extraFieldSchema).optional(),
  })
  .superRefine((values, context) => {
    if (
      (values.documentType === "CNPJ" || values.documentType === "MEI") &&
      digitsOnly(values.cnpj).length !== 14
    ) {
      context.addIssue({
        code: "custom",
        message: "Informe 14 digitos para CNPJ/MEI.",
        path: ["cnpj"],
      });
    }

    const phoneLength = digitsOnly(values.phone).length;
    if (phoneLength > 0 && phoneLength !== 10 && phoneLength !== 11) {
      context.addIssue({
        code: "custom",
        message: "Informe um telefone com 10 ou 11 digitos.",
        path: ["phone"],
      });
    }

    const zipLength = digitsOnly(values.zipCode).length;
    if (zipLength > 0 && zipLength !== 8) {
      context.addIssue({
        code: "custom",
        message: "Informe um CEP com 8 digitos.",
        path: ["zipCode"],
      });
    }
  });

export type CompanyFormValues = z.infer<typeof companySchema>;
export const companyDocumentTypeOptions = documentTypeOptions;
export const companyLegalTypeOptions = legalTypeOptions;
export const companySegmentOptionsList = companySegmentOptions;
