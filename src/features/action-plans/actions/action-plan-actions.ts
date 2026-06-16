"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { hasRole, requireAuth } from "@/auth";
import { NotificationService } from "@/features/notifications/services/notification-service";
import type { AppRole } from "@/lib/auth-utils";

import {
  actionPlanSchema,
  type ActionPlanFormValues,
  type ActionPlanStatusValue,
} from "../schemas/action-plan-schema";
import {
  createActionPlanForOrganization,
  deleteActionPlanForOrganization,
  updateActionPlanForOrganization,
  updateActionPlanStatusForOrganization,
} from "../services/action-plan-service";

type ActionPlanActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof ActionPlanFormValues, string>>;
};

const editorRoles = ["ADMIN", "CONSULTANT"] as const;
const deleteRoles = ["ADMIN"] as const;
const reviewerRoles = ["ADMIN", "CONSULTANT"] as const;
const progressRoles = ["ADMIN", "CONSULTANT", "CLIENT"] as const;

function toFieldErrors(
  error: z.ZodError<ActionPlanFormValues>,
): ActionPlanActionState["fieldErrors"] {
  const flattened = error.flatten().fieldErrors;
  const fieldErrors: ActionPlanActionState["fieldErrors"] = {};

  for (const [field, messages] of Object.entries(flattened)) {
    const message = messages?.[0];

    if (message) {
      fieldErrors[field as keyof ActionPlanFormValues] = message;
    }
  }

  return fieldErrors;
}

async function getContext(roles: readonly AppRole[]) {
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
  values: ActionPlanFormValues,
): { values: ActionPlanFormValues } | ActionPlanActionState {
  const parsed = actionPlanSchema.safeParse(values);

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) };
  }

  return { values: parsed.data };
}

export async function createActionPlanAction(
  values: ActionPlanFormValues,
  returnTo?: string,
): Promise<ActionPlanActionState | void> {
  const context = await getContext(editorRoles);

  if (isError(context)) {
    return context;
  }

  const validation = validateValues(values);

  if (!("values" in validation)) {
    return validation;
  }

  let id: string;
  let nonConformityId: string;

  try {
    const created = await createActionPlanForOrganization({
      createdById: context.userId,
      organizationId: context.organizationId,
      values: validation.values,
    });

    if (!created) {
      return { fieldErrors: { nonConformityId: "Não conformidade inválida." } };
    }

    id = created.id;
    nonConformityId = created.nonConformityId;
    await NotificationService.notifyClientsAboutActionPlan(id);
  } catch {
    return { error: "Não foi possível criar o plano de ação." };
  }

  revalidatePath("/action-plans");
  revalidatePath("/notifications");
  revalidatePath(`/non-conformities/${nonConformityId}`);

  if (returnTo) {
    redirect(`${returnTo}?plan=1`);
  }

  redirect(`/action-plans/${id}?created=1`);
}

export async function updateActionPlanAction({
  id,
  returnTo,
  values,
}: {
  id: string;
  returnTo?: string;
  values: ActionPlanFormValues;
}): Promise<ActionPlanActionState | void> {
  const context = await getContext(editorRoles);

  if (isError(context)) {
    return context;
  }

  const validation = validateValues(values);

  if (!("values" in validation)) {
    return validation;
  }

  let nonConformityId: string;

  try {
    const updated = await updateActionPlanForOrganization({
      id,
      organizationId: context.organizationId,
      userId: context.userId,
      values: validation.values,
    });

    if (!updated) {
      return { error: "Plano de ação não encontrado." };
    }

    nonConformityId = updated.nonConformityId;
  } catch {
    return { error: "Não foi possível atualizar o plano de ação." };
  }

  revalidatePath("/action-plans");
  revalidatePath(`/action-plans/${id}`);
  revalidatePath(`/non-conformities/${nonConformityId}`);

  if (returnTo) {
    redirect(`${returnTo}?plan=1`);
  }

  redirect(`/action-plans/${id}?updated=1`);
}

export async function updateActionPlanStatusAction({
  id,
  returnTo,
  status,
}: {
  id: string;
  returnTo?: string;
  status: ActionPlanStatusValue;
}): Promise<ActionPlanActionState | void> {
  const roles =
    status === "APPROVED" || status === "REJECTED"
      ? reviewerRoles
      : progressRoles;
  const context = await getContext(roles);

  if (isError(context)) {
    return context;
  }

  let nonConformityId: string;

  try {
    const updated = await updateActionPlanStatusForOrganization({
      id,
      organizationId: context.organizationId,
      status,
      userId: context.userId,
    });

    if (!updated) {
      return { error: "Plano de ação não encontrado." };
    }

    nonConformityId = updated.nonConformityId;
    if (status === "AWAITING_REVIEW") {
      await NotificationService.notifyReviewersAboutActionPlanCompleted(id);
    }
    if (status === "APPROVED" || status === "REJECTED") {
      await NotificationService.notifyClientsAboutActionPlanReview({
        actionPlanId: id,
        approved: status === "APPROVED",
      });
    }
  } catch {
    return { error: "Não foi possível atualizar o status do plano." };
  }

  revalidatePath("/action-plans");
  revalidatePath("/notifications");
  revalidatePath(`/action-plans/${id}`);
  revalidatePath(`/non-conformities/${nonConformityId}`);

  if (returnTo) {
    redirect(`${returnTo}?plan=1`);
  }

  redirect(`/action-plans/${id}?status=1`);
}

export async function deleteActionPlanAction(
  id: string,
  returnTo?: string,
): Promise<ActionPlanActionState | void> {
  const context = await getContext(deleteRoles);

  if (isError(context)) {
    return context;
  }

  try {
    const result = await deleteActionPlanForOrganization({
      id,
      organizationId: context.organizationId,
    });

    if (!result.deleted) {
      if (result.reason === "has_history") {
        return {
          error:
            "Este plano já possui histórico de movimentação. Para preservar a rastreabilidade, ele não pode ser excluído.",
        };
      }

      return { error: "Plano de ação não encontrado." };
    }

    revalidatePath("/action-plans");
    revalidatePath(`/non-conformities/${result.nonConformityId}`);
  } catch {
    return { error: "Não foi possível excluir o plano de ação." };
  }

  if (returnTo) {
    redirect(`${returnTo}?deleted=1`);
  }

  redirect("/action-plans?deleted=1");
}
