"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { hasRole, requireAuth } from "@/auth";

import { auditSchema, type AuditFormValues } from "../schemas/audit-schema";
import {
  companyBelongsToOrganization,
  createAuditForOrganization,
} from "../services/audit-service";

type AuditActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof AuditFormValues, string>>;
};

const auditCreatorRoles = ["ADMIN", "CONSULTANT"] as const;

function toFieldErrors(
  error: z.ZodError<AuditFormValues>,
): AuditActionState["fieldErrors"] {
  const flattened = error.flatten().fieldErrors;
  const fieldErrors: AuditActionState["fieldErrors"] = {};

  for (const [field, messages] of Object.entries(flattened)) {
    const message = messages?.[0];

    if (message) {
      fieldErrors[field as keyof AuditFormValues] = message;
    }
  }

  return fieldErrors;
}

export async function createAuditAction(
  values: AuditFormValues,
): Promise<AuditActionState | void> {
  const user = await requireAuth();

  if (!user.organizationId) {
    return {
      error: "Seu usuário não está vinculado a uma organização.",
    };
  }

  if (!hasRole(user, auditCreatorRoles)) {
    return {
      error: "Seu perfil não tem permissão para criar auditorias.",
    };
  }

  const parsed = auditSchema.safeParse(values);

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const companyIsValid = await companyBelongsToOrganization({
    companyId: parsed.data.companyId,
    organizationId: user.organizationId,
  });

  if (!companyIsValid) {
    return {
      fieldErrors: {
        companyId: "Selecione uma empresa da sua organização.",
      },
    };
  }

  let auditId: string;

  try {
    const audit = await createAuditForOrganization({
      createdById: user.id,
      organizationId: user.organizationId,
      values: parsed.data,
    });

    auditId = audit.id;
  } catch {
    return {
      error: "Não foi possível criar a auditoria. Tente novamente.",
    };
  }

  revalidatePath("/audits");
  redirect(`/audits/${auditId}?created=1`);
}
