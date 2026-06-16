"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

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
  getOrganizationUserForEdit,
  removeOrganizationUserAccess,
  updateOrganizationSettings,
  updateOrganizationUser,
} from "../services/settings-service";

type SettingsActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof OrganizationSettingsValues, string>>;
  logoError?: string;
  logoUrl?: string;
  success?: string;
};

type UserSettingsActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof UserSettingsValues, string>>;
};

const adminRoles = ["ADMIN"] as const;
const allowedLogoMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/webp",
]);
const allowedLogoExtensions = new Set([".jpg", ".jpeg", ".png", ".svg", ".webp"]);

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function getOrganizationSettingsValues(
  formData: FormData,
): OrganizationSettingsValues {
  return {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    cnpj: String(formData.get("cnpj") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    address: String(formData.get("address") ?? ""),
  };
}

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
  formData: FormData,
): Promise<SettingsActionState> {
  const user = await requireAuth();

  if (!user.organizationId) {
    return { error: "Seu usuário não está vinculado a uma organização." };
  }

  if (!hasRole(user, adminRoles)) {
    return { error: "Seu perfil não tem permissão para editar a organização." };
  }

  const parsed = organizationSettingsSchema.safeParse(
    getOrganizationSettingsValues(formData),
  );

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) };
  }

  let savedLogoUrl: string | undefined;

  try {
    let logoPath: string | null | undefined;
    const logoFile = formData.get("logoFile");

    if (logoFile instanceof File && logoFile.size > 0) {
      const maxSizeInBytes = 5 * 1024 * 1024;
      const extension = path.extname(logoFile.name).toLowerCase();
      const hasAllowedMimeType =
        logoFile.type.length > 0 && allowedLogoMimeTypes.has(logoFile.type);
      const hasAllowedExtension = allowedLogoExtensions.has(extension);

      if (!hasAllowedMimeType && !hasAllowedExtension) {
        return {
          logoError: "Envie uma imagem JPG, PNG, SVG ou WEBP para a logo.",
        };
      }

      if (logoFile.size > maxSizeInBytes) {
        return {
          logoError: "A logo deve ter no máximo 5 MB.",
        };
      }

      const baseName = path.basename(logoFile.name, extension);
      const safeName = sanitizeFileName(baseName || "logo");
      const finalFileName = `${safeName || "logo"}-${user.organizationId}-${randomUUID()}${extension}`;
      const uploadsDirectory = path.join(
        process.cwd(),
        "public",
        "uploads",
        "organization-logos",
      );

      await mkdir(uploadsDirectory, { recursive: true });

      const arrayBuffer = await logoFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const absoluteFilePath = path.join(uploadsDirectory, finalFileName);

      await writeFile(absoluteFilePath, buffer);
      logoPath = `/uploads/organization-logos/${finalFileName}`;
      savedLogoUrl = logoPath;
    }

    await updateOrganizationSettings({
      organizationId: user.organizationId,
      logoPath,
      values: parsed.data,
    });
  } catch {
    return { error: "Não foi possível atualizar a organização." };
  }

  revalidatePath("/settings");

  return {
    logoUrl: savedLogoUrl,
    success: "Organização atualizada com sucesso.",
  };
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

  const isAdmin = hasRole(user, adminRoles);
  const isSelfEdit = userId === user.id;

  if (!isAdmin && !isSelfEdit) {
    return { error: "Somente administradores podem editar usuários." };
  }

  const parsed = userSettingsSchema.safeParse(values);

  if (!parsed.success) {
    return { fieldErrors: toUserFieldErrors(parsed.error) };
  }

  const membership = await getOrganizationUserForEdit({
    organizationId: user.organizationId,
    userId,
  });

  if (!membership) {
    return { error: "Usuário não encontrado nesta organização." };
  }

  const safeValues: UserSettingsValues = isAdmin
    ? parsed.data
    : {
        ...parsed.data,
        role: membership.role,
      };

  const passwordHash = safeValues.password
    ? await hashPassword(safeValues.password)
    : null;

  try {
    const updated = await updateOrganizationUser({
      organizationId: user.organizationId,
      passwordHash,
      userId,
      values: safeValues,
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
