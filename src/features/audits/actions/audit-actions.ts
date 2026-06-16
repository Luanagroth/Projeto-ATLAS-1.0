"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { hasRole, requireAuth } from "@/auth";
import { NotificationService } from "@/features/notifications/services/notification-service";

import {
  auditSchema,
  auditStatusTransitions,
  updateAuditStatusSchema,
  type AuditFormValues,
  type AuditStatusValue,
} from "../schemas/audit-schema";
import {
  companyBelongsToOrganization,
  createAuditForOrganization,
  getAuditByIdForOrganization,
  updateAuditStatusForOrganization,
} from "../services/audit-service";

type AuditActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof AuditFormValues, string>>;
};

type AuditStatusActionState = {
  error?: string;
};

const auditCreatorRoles = ["ADMIN", "CONSULTANT"] as const;
const auditStatusRoles = ["ADMIN", "CONSULTANT"] as const;

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

export async function updateAuditStatusAction(
  input: { auditId: string; status: AuditStatusValue },
): Promise<AuditStatusActionState | void> {
  const user = await requireAuth();

  if (!user.organizationId) {
    return { error: "Seu usuário não está vinculado a uma organização." };
  }

  if (!hasRole(user, auditStatusRoles)) {
    return { error: "Seu perfil não tem permissão para alterar o status da auditoria." };
  }

  const parsed = updateAuditStatusSchema.safeParse(input);

  if (!parsed.success) {
    return { error: "Dados inválidos." };
  }

  // Valida transição de status
  const current = await getAuditByIdForOrganization({
    auditId: parsed.data.auditId,
    organizationId: user.organizationId,
  });

  if (!current) {
    return { error: "Auditoria não encontrada." };
  }

  const allowedTransitions = auditStatusTransitions[current.status as AuditStatusValue] ?? [];

  if (!allowedTransitions.includes(parsed.data.status)) {
    return {
      error: `Não é possível passar de "${current.status}" para "${parsed.data.status}".`,
    };
  }

  try {
    const updated = await updateAuditStatusForOrganization({
      auditId: parsed.data.auditId,
      organizationId: user.organizationId,
      status: parsed.data.status,
    });

    if (!updated) {
      return { error: "Auditoria não encontrada." };
    }

    if (parsed.data.status === "COMPLETED") {
      await NotificationService.notifyAuditCompleted(parsed.data.auditId);
    }
  } catch {
    return { error: "Não foi possível atualizar o status. Tente novamente." };
  }

  revalidatePath(`/audits/${parsed.data.auditId}`);
  revalidatePath("/audits");
  revalidatePath("/notifications");
  redirect(`/audits/${parsed.data.auditId}?status=1`);
}
