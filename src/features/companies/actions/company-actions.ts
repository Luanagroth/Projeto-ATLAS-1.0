"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { hasRole, requireAuth } from "@/auth";

import { companySchema, type CompanyFormValues } from "../schemas/company-schema";
import {
  countCompanyAuditsForOrganization,
  createCompanyForOrganization,
  deleteCompanyForOrganization,
  findCompanyDuplicate,
  isRelationConstraintError,
  isUniqueCompanyConstraintError,
  updateCompanyForOrganization,
} from "../services/company-service";

type CompanyActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof CompanyFormValues, string>>;
};

const companyManagerRoles = ["ADMIN", "CONSULTANT"] as const;
const companyDeleteRoles = ["ADMIN"] as const;

function toFieldErrors(
  error: z.ZodError<CompanyFormValues>,
): CompanyActionState["fieldErrors"] {
  const flattened = error.flatten().fieldErrors;
  const fieldErrors: CompanyActionState["fieldErrors"] = {};

  for (const [field, messages] of Object.entries(flattened)) {
    const message = messages?.[0];

    if (message) {
      fieldErrors[field as keyof CompanyFormValues] = message;
    }
  }

  return fieldErrors;
}

async function getWritableCompanyContext(): Promise<
  | {
      organizationId: string;
    }
  | CompanyActionState
> {
  const user = await requireAuth();

  if (!user.organizationId) {
    return {
      error: "Seu usuário não está vinculado a uma organização.",
    };
  }

  if (!hasRole(user, companyManagerRoles)) {
    return {
      error: "Seu perfil não tem permissão para gerenciar empresas.",
    };
  }

  return {
    organizationId: user.organizationId,
  };
}

async function getDeleteCompanyContext(): Promise<
  | {
      organizationId: string;
    }
  | CompanyActionState
> {
  const user = await requireAuth();

  if (!user.organizationId) {
    return {
      error: "Seu usuário não está vinculado a uma organização.",
    };
  }

  if (!hasRole(user, companyDeleteRoles)) {
    return {
      error: "Somente administradores podem excluir empresas.",
    };
  }

  return {
    organizationId: user.organizationId,
  };
}

function isActionError(
  value: Awaited<ReturnType<typeof getWritableCompanyContext>>,
): value is CompanyActionState {
  return "error" in value || "fieldErrors" in value;
}

async function validateCompanyValues(
  values: CompanyFormValues,
): Promise<
  | {
      values: CompanyFormValues;
    }
  | CompanyActionState
> {
  const parsed = companySchema.safeParse(values);

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  return {
    values: parsed.data,
  };
}

function duplicateFieldError(duplicate: "cnpj" | "name"): CompanyActionState {
  if (duplicate === "cnpj") {
    return {
      fieldErrors: {
        cnpj: "Já existe uma empresa com este CNPJ nesta organização.",
      },
    };
  }

  return {
    fieldErrors: {
      name: "Já existe uma empresa sem CNPJ com este nome nesta organização.",
    },
  };
}

export async function createCompanyAction(
  values: CompanyFormValues,
): Promise<CompanyActionState | void> {
  const context = await getWritableCompanyContext();

  if (isActionError(context)) {
    return context;
  }

  const validation = await validateCompanyValues(values);

  if (!("values" in validation)) {
    return validation;
  }

  const parsedValues = validation.values;

  const duplicate = await findCompanyDuplicate({
    organizationId: context.organizationId,
    values: parsedValues,
  });

  if (duplicate) {
    return duplicateFieldError(duplicate);
  }

  let companyId: string;

  try {
    const company = await createCompanyForOrganization({
      organizationId: context.organizationId,
      values: parsedValues,
    });

    companyId = company.id;
  } catch (error) {
    if (isUniqueCompanyConstraintError(error)) {
      return duplicateFieldError(parsedValues.cnpj ? "cnpj" : "name");
    }

    return {
      error: "Não foi possível criar a empresa. Tente novamente.",
    };
  }

  revalidatePath("/companies");
  redirect(`/companies/${companyId}?created=1`);
}

export async function updateCompanyAction({
  companyId,
  values,
}: {
  companyId: string;
  values: CompanyFormValues;
}): Promise<CompanyActionState | void> {
  const context = await getWritableCompanyContext();

  if (isActionError(context)) {
    return context;
  }

  const validation = await validateCompanyValues(values);

  if (!("values" in validation)) {
    return validation;
  }

  const parsedValues = validation.values;

  const duplicate = await findCompanyDuplicate({
    organizationId: context.organizationId,
    values: parsedValues,
    ignoreCompanyId: companyId,
  });

  if (duplicate) {
    return duplicateFieldError(duplicate);
  }

  try {
    const updated = await updateCompanyForOrganization({
      companyId,
      organizationId: context.organizationId,
      values: parsedValues,
    });

    if (!updated) {
      return {
        error: "Empresa não encontrada para esta organização.",
      };
    }
  } catch (error) {
    if (isUniqueCompanyConstraintError(error)) {
      return duplicateFieldError(parsedValues.cnpj ? "cnpj" : "name");
    }

    return {
      error: "Não foi possível atualizar a empresa. Tente novamente.",
    };
  }

  revalidatePath("/companies");
  revalidatePath(`/companies/${companyId}`);
  redirect(`/companies/${companyId}?updated=1`);
}

export async function deleteCompanyAction(
  companyId: string,
): Promise<CompanyActionState | void> {
  const context = await getDeleteCompanyContext();

  if (isActionError(context)) {
    return context;
  }

  const auditsCount = await countCompanyAuditsForOrganization({
    companyId,
    organizationId: context.organizationId,
  });

  if (auditsCount > 0) {
    return {
      error:
        "Esta empresa possui auditorias vinculadas e não pode ser excluída.",
    };
  }

  try {
    const deleted = await deleteCompanyForOrganization({
      companyId,
      organizationId: context.organizationId,
    });

    if (!deleted) {
      return {
        error: "Empresa não encontrada para esta organização.",
      };
    }
  } catch (error) {
    if (isRelationConstraintError(error)) {
      return {
        error:
          "Esta empresa possui registros vinculados e não pode ser excluída agora.",
      };
    }

    return {
      error: "Não foi possível excluir a empresa. Tente novamente.",
    };
  }

  revalidatePath("/companies");
  redirect("/companies?deleted=1");
}
