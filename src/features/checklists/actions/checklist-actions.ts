"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { hasRole, requireAuth } from "@/auth";

import {
  checklistSchema,
  type ChecklistFormValues,
} from "../schemas/checklist-schema";
import {
  createChecklistForOrganization,
  deleteChecklistForOrganization,
  isRelationConstraintError,
  updateChecklistForOrganization,
} from "../services/checklist-service";

type ChecklistActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof ChecklistFormValues, string>>;
};

const checklistEditorRoles = ["ADMIN", "CONSULTANT"] as const;
const checklistAdminRoles = ["ADMIN"] as const;

function toFieldErrors(
  error: z.ZodError<ChecklistFormValues>,
): ChecklistActionState["fieldErrors"] {
  const flattened = error.flatten().fieldErrors;
  const fieldErrors: ChecklistActionState["fieldErrors"] = {};

  for (const [field, messages] of Object.entries(flattened)) {
    const message = messages?.[0];

    if (message) {
      fieldErrors[field as keyof ChecklistFormValues] = message;
    }
  }

  return fieldErrors;
}

async function getChecklistContext({
  adminOnly = false,
}: {
  adminOnly?: boolean;
} = {}): Promise<
  | {
      organizationId: string;
    }
  | ChecklistActionState
> {
  const user = await requireAuth();

  if (!user.organizationId) {
    return {
      error: "Seu usuário não está vinculado a uma organização.",
    };
  }

  const roles = adminOnly ? checklistAdminRoles : checklistEditorRoles;

  if (!hasRole(user, roles)) {
    return {
      error: "Seu perfil não tem permissão para gerenciar modelos.",
    };
  }

  return {
    organizationId: user.organizationId,
  };
}

function isActionError(
  value: Awaited<ReturnType<typeof getChecklistContext>>,
): value is ChecklistActionState {
  return "error" in value || "fieldErrors" in value;
}

function validateChecklistValues(
  values: ChecklistFormValues,
):
  | {
      values: ChecklistFormValues;
    }
  | ChecklistActionState {
  const parsed = checklistSchema.safeParse(values);

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  return {
    values: parsed.data,
  };
}

export async function createChecklistAction(
  values: ChecklistFormValues,
): Promise<ChecklistActionState | void> {
  const context = await getChecklistContext();

  if (isActionError(context)) {
    return context;
  }

  const validation = validateChecklistValues(values);

  if (!("values" in validation)) {
    return validation;
  }

  let checklistId: string;

  try {
    const checklist = await createChecklistForOrganization({
      organizationId: context.organizationId,
      values: validation.values,
    });

    checklistId = checklist.id;
  } catch {
    return {
      error: "Não foi possível criar o modelo. Tente novamente.",
    };
  }

  revalidatePath("/checklists");
  redirect(`/checklists/${checklistId}?created=1`);
}

export async function updateChecklistAction({
  checklistId,
  values,
}: {
  checklistId: string;
  values: ChecklistFormValues;
}): Promise<ChecklistActionState | void> {
  const context = await getChecklistContext();

  if (isActionError(context)) {
    return context;
  }

  const validation = validateChecklistValues(values);

  if (!("values" in validation)) {
    return validation;
  }

  try {
    const updated = await updateChecklistForOrganization({
      checklistId,
      organizationId: context.organizationId,
      values: validation.values,
    });

    if (!updated) {
      return {
        error: "Modelo não encontrado para esta organização.",
      };
    }
  } catch {
    return {
      error: "Não foi possível atualizar o modelo. Tente novamente.",
    };
  }

  revalidatePath("/checklists");
  revalidatePath(`/checklists/${checklistId}`);
  redirect(`/checklists/${checklistId}?updated=1`);
}

export async function deleteChecklistAction(
  checklistId: string,
): Promise<ChecklistActionState | void> {
  const context = await getChecklistContext({ adminOnly: true });

  if (isActionError(context)) {
    return context;
  }

  try {
    const deleted = await deleteChecklistForOrganization({
      checklistId,
      organizationId: context.organizationId,
    });

    if (!deleted) {
      return {
        error: "Modelo não encontrado para esta organização.",
      };
    }
  } catch (error) {
    if (isRelationConstraintError(error)) {
      return {
        error:
          "Este modelo possui registros vinculados e não pode ser excluído agora.",
      };
    }

    return {
      error: "Não foi possível excluir o modelo. Tente novamente.",
    };
  }

  revalidatePath("/checklists");
  redirect("/checklists?deleted=1");
}
