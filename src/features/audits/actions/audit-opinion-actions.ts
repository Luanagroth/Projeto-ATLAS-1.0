"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { hasRole, requireAuth } from "@/auth";
import { NotificationService } from "@/features/notifications/services/notification-service";
import type { AppRole } from "@/lib/auth-utils";

import {
  auditOpinionSchema,
  type AuditOpinionFormValues,
} from "../schemas/audit-opinion-schema";
import { upsertAuditOpinionForOrganization } from "../services/audit-opinion-service";

type AuditOpinionActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof AuditOpinionFormValues, string>>;
  ok?: true;
};

const editorRoles = ["ADMIN", "CONSULTANT"] as const;

function toFieldErrors(error: z.ZodError<AuditOpinionFormValues>) {
  const flattened = error.flatten().fieldErrors;
  const fieldErrors: AuditOpinionActionState["fieldErrors"] = {};

  for (const [field, messages] of Object.entries(flattened)) {
    const message = messages?.[0];
    if (message) fieldErrors[field as keyof AuditOpinionFormValues] = message;
  }

  return fieldErrors;
}

async function getContext(roles: readonly AppRole[]) {
  const user = await requireAuth();

  if (!user.organizationId) {
    return { error: "Seu usuario nao esta vinculado a uma organizacao." };
  }

  if (!hasRole(user, roles)) {
    return { error: "Seu perfil nao tem permissao para esta acao." };
  }

  return { organizationId: user.organizationId, userId: user.id };
}

function isError(value: Awaited<ReturnType<typeof getContext>>): value is {
  error: string;
} {
  return "error" in value;
}

export async function saveAuditOpinionAction(
  values: AuditOpinionFormValues,
): Promise<AuditOpinionActionState> {
  const context = await getContext(editorRoles);

  if (isError(context)) return context;

  const parsed = auditOpinionSchema.safeParse(values);

  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) };
  }

  try {
    const opinion = await upsertAuditOpinionForOrganization({
      organizationId: context.organizationId,
      userId: context.userId,
      values: parsed.data,
    });

    if (!opinion) return { error: "Auditoria nao encontrada." };

    if (parsed.data.status === "COMPLETED") {
      await NotificationService.notifyOpinionCompleted(opinion.auditId);
      revalidatePath("/notifications");
    }

    revalidatePath(`/audits/${opinion.auditId}`);
    return { ok: true };
  } catch {
    return { error: "Nao foi possivel salvar o parecer." };
  }
}
