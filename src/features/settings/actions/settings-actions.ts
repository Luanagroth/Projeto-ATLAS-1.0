"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { hasRole, requireAuth } from "@/auth";
import { hashPassword } from "@/lib/auth-utils";

import {
  organizationSettingsSchema,
  type OrganizationSettingsValues,
} from "../schemas/settings-schema";
import {
  userSettingsSchema,
  type UserSettingsValues,
} from "../schemas/user-settings-schema";
import {
  removeOrganizationUserAccess,
  updateOrganizationSettings,
  updateOrganizationUser,
} from "../services/settings-service";

type SettingsActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof OrganizationSettingsValues, string>>;
  success?: string;
};

type UserSettingsActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof UserSettingsValues, string>>;
};

const adminRoles = ["ADMIN"] as const;

function toFieldErrors(
  error: z.ZodError<OrganizationSettingsValues>,
): SettingsActionState["fieldErrors"] {
  const flattened = error.flatten().fieldErrors;
  const fieldErrors: SettingsActionState["fieldErrors"] = {};

  for (const [field, messages] of Object.entries(flattened)) {
    const message = messages?.[0];

    if (message) {
      fieldErrors[field as keyof OrganizationSettingsValues] = message;
    }
  }

  return fieldErrors;
}

function toUserFieldErrors(
  error: z.ZodError<UserSettingsValues>,
): UserSettingsActionState["fieldErrors"] {
  const flattened = error.flatten().fieldErrors;
  const fieldErrors: UserSettingsActionState["fieldErrors"] = {};

  for (const [field, messages] of Object.entries(flattened)) {
    const message = messages?.[0];

    if (message) {
      fieldErrors[field as keyof UserSettingsValues] = message;
    }
  }

  return fieldErrors;
}

export async function updateOrganizationSettingsAction(
  values: OrganizationSettingsValues,
): Promise<SettingsActionState> {
  const user = await requireAuth();

  if (!user.organizationId) {
    return { error: "Seu usuário não está vinculado a uma organização." };
  }

  if (!hasRole(user, adminRoles)) {
    return { error: "Seu perfil não tem permissão para editar a organização." };
  }

  const parsed = organizationSettingsSchema.safeParse(values);

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) };
  }

  try {
    await updateOrganizationSettings({
      organizationId: user.organizationId,
      values: parsed.data,
    });
  } catch {
    return { error: "Não foi possível atualizar a organização." };
  }

  revalidatePath("/settings");
  return { success: "Organização atualizada com sucesso." };
}

export async function updateOrganizationUserAction({
  userId,
  values,
}: {
  userId: string;
  values: UserSettingsValues;
}): Promise<UserSettingsActionState | void> {
  const user = await requireAuth();

  if (!user.organizationId) {
    return { error: "Seu usuário não está vinculado a uma organização." };
  }

  if (!hasRole(user, adminRoles)) {
    return { error: "Somente administradores podem editar usuários." };
  }

  const parsed = userSettingsSchema.safeParse(values);

  if (!parsed.success) {
    return { fieldErrors: toUserFieldErrors(parsed.error) };
  }

  const passwordHash = parsed.data.password
    ? await hashPassword(parsed.data.password)
    : null;

  try {
    const updated = await updateOrganizationUser({
      organizationId: user.organizationId,
      passwordHash,
      userId,
      values: parsed.data,
    });

    if (!updated) {
      return { error: "Usuário não encontrado nesta organização." };
    }
  } catch {
    return { error: "Não foi possível atualizar o usuário." };
  }

  revalidatePath("/settings");
  revalidatePath(`/settings/users/${userId}/edit`);
}

export async function removeOrganizationUserAccessAction(
  userId: string,
): Promise<UserSettingsActionState | void> {
  const user = await requireAuth();

  if (!user.organizationId) {
    return { error: "Seu usuário não está vinculado a uma organização." };
  }

  if (!hasRole(user, adminRoles)) {
    return { error: "Somente administradores podem remover acessos." };
  }

  try {
    const result = await removeOrganizationUserAccess({
      currentUserId: user.id,
      organizationId: user.organizationId,
      userId,
    });

    if (!result.removed) {
      if (result.reason === "self") {
        return { error: "Você não pode remover seu próprio acesso." };
      }

      if (result.reason === "last_admin") {
        return {
          error: "Não é possível remover o último administrador da organização.",
        };
      }

      return { error: "Usuário não encontrado nesta organização." };
    }
  } catch {
    return { error: "Não foi possível remover o acesso do usuário." };
  }

  revalidatePath("/settings");
}
