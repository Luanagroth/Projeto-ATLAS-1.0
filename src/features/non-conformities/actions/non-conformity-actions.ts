"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { hasRole, requireAuth } from "@/auth";
import { logAuditEvent } from "@/features/audits/services/audit-service";
import { NotificationService } from "@/features/notifications/services/notification-service";

import {
  nonConformitySchema,
  type NonConformityFormValues,
} from "../schemas/non-conformity-schema";
import {
  auditBelongsToOrganization,
  countActionPlansForNonConformity,
  createNonConformityForOrganization,
  deleteNonConformityForOrganization,
  getNonConformityByIdForOrganization,
  resolveNonConformityForOrganization,
  updateNonConformityForOrganization,
} from "../services/non-conformity-service";

export type NonConformityActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof NonConformityFormValues, string>>;
};

const ncEditorRoles = ["ADMIN", "CONSULTANT"] as const;
const ncCloserRoles = ["ADMIN"] as const;
const ncDeleteRoles = ["ADMIN"] as const;

function toFieldErrors(
  error: z.ZodError<NonConformityFormValues>,
): NonConformityActionState["fieldErrors"] {
  const flattened = error.flatten().fieldErrors;
  const fieldErrors: NonConformityActionState["fieldErrors"] = {};

  for (const [field, messages] of Object.entries(flattened)) {
    const message = messages?.[0];
    if (message) {
      fieldErrors[field as keyof NonConformityFormValues] = message;
    }
  }

  return fieldErrors;
}

async function getContext(roles: typeof ncEditorRoles | typeof ncCloserRoles) {
  const user = await requireAuth();

  if (!user.organizationId) {
    return { error: "Seu usuário não está vinculado a uma organização." };
  }

  if (!hasRole(user, roles)) {
    return { error: "Seu perfil não tem permissão para esta ação." };
  }

  return { organizationId: user.organizationId, userId: user.id };
}

function isError(value: Awaited<ReturnType<typeof getContext>>): value is {
  error: string;
} {
  return "error" in value;
}

function validateValues(
  values: NonConformityFormValues,
): { values: NonConformityFormValues } | NonConformityActionState {
  const parsed = nonConformitySchema.safeParse(values);

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) };
  }

  return { values: parsed.data };
}

export async function createNonConformityAction(
  values: NonConformityFormValues,
  returnTo?: string,
): Promise<NonConformityActionState | void> {
  const context = await getContext(ncEditorRoles);

  if (isError(context)) {
    return context;
  }

  const validation = validateValues(values);

  if (!("values" in validation)) {
    return validation;
  }

  const auditIsValid = await auditBelongsToOrganization({
    auditId: validation.values.auditId,
    organizationId: context.organizationId,
  });

  if (!auditIsValid) {
    return { fieldErrors: { auditId: "Auditoria inválida." } };
  }

  let id: string;

  try {
    const nc = await createNonConformityForOrganization({
      createdById: context.userId,
      values: validation.values,
    });
    id = nc.id;
    await NotificationService.notifyClientsAboutNonConformity(id);

    try {
      await logAuditEvent({
        auditId: validation.values.auditId,
        organizationId: context.organizationId,
        action: "NC_CREATED",
        entity: "NON_CONFORMITY",
        changes: { nonConformityId: id, title: validation.values.title },
      });
    } catch {
      // Log não crítico
    }
  } catch {
    return { error: "Não foi possível criar a não conformidade." };
  }

  revalidatePath("/non-conformities");
  revalidatePath("/notifications");
  revalidatePath(`/audits/${validation.values.auditId}`);

  // Retorna para o contexto de origem se fornecido
  if (returnTo) {
    redirect(`${returnTo}?nc=1`);
  }

  redirect(`/non-conformities/${id}?created=1`);
}

export async function updateNonConformityAction({
  id,
  returnTo,
  values,
}: {
  id: string;
  returnTo?: string;
  values: NonConformityFormValues;
}): Promise<NonConformityActionState | void> {
  const context = await getContext(ncEditorRoles);

  if (isError(context)) {
    return context;
  }

  const validation = validateValues(values);

  if (!("values" in validation)) {
    return validation;
  }

  try {
    const updated = await updateNonConformityForOrganization({
      id,
      organizationId: context.organizationId,
      values: validation.values,
    });

    if (!updated) {
      return { error: "Não conformidade não encontrada." };
    }
  } catch {
    return { error: "Não foi possível atualizar a não conformidade." };
  }

  revalidatePath("/non-conformities");
  revalidatePath(`/non-conformities/${id}`);
  revalidatePath(`/audits/${validation.values.auditId}`);

  if (returnTo) {
    redirect(`${returnTo}?nc=1`);
  }

  redirect(`/non-conformities/${id}?updated=1`);
}

export async function resolveNonConformityAction(
  id: string,
  returnTo?: string,
): Promise<NonConformityActionState | void> {
  const context = await getContext(ncCloserRoles);

  if (isError(context)) {
    return context;
  }

  // Busca auditId para revalidar
  const nc = await getNonConformityByIdForOrganization({
    id,
    organizationId: context.organizationId,
  });

  const resolved = await resolveNonConformityForOrganization({
    id,
    organizationId: context.organizationId,
  });

  if (!resolved) {
    return { error: "Não conformidade não encontrada." };
  }

  revalidatePath("/non-conformities");
  revalidatePath(`/non-conformities/${id}`);
  if (nc?.audit.id) {
    revalidatePath(`/audits/${nc.audit.id}`);
  }

  if (returnTo) {
    redirect(`${returnTo}?nc=1`);
  }

  redirect(`/non-conformities/${id}?resolved=1`);
}

export async function deleteNonConformityAction(
  id: string,
  returnTo?: string,
): Promise<NonConformityActionState | void> {
  const context = await getContext(ncDeleteRoles);

  if (isError(context)) {
    return context;
  }

  const actionPlansCount = await countActionPlansForNonConformity({
    id,
    organizationId: context.organizationId,
  });

  if (actionPlansCount > 0) {
    return {
      error:
        "Esta não conformidade possui planos de ação vinculados e não pode ser excluída.",
    };
  }

  // Busca auditId antes de deletar
  const nc = await getNonConformityByIdForOrganization({
    id,
    organizationId: context.organizationId,
  });

  try {
    const deleted = await deleteNonConformityForOrganization({
      id,
      organizationId: context.organizationId,
    });

    if (!deleted) {
      return { error: "Não conformidade não encontrada." };
    }
  } catch {
    return { error: "Não foi possível excluir a não conformidade." };
  }

  revalidatePath("/non-conformities");
  if (nc?.audit.id) {
    revalidatePath(`/audits/${nc.audit.id}`);
  }

  if (returnTo) {
    redirect(`${returnTo}?deleted=1`);
  }

  redirect("/non-conformities?deleted=1");
}
