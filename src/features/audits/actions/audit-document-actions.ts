"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { hasRole, requireAuth } from "@/auth";
import { NotificationService } from "@/features/notifications/services/notification-service";
import type { AppRole } from "@/lib/auth-utils";

import {
  auditDocumentSchema,
  type AuditDocumentFormValues,
} from "../schemas/audit-document-schema";
import {
  createAuditDocumentForOrganization,
  deleteAuditDocumentForOrganization,
} from "../services/audit-document-service";

type AuditDocumentActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof AuditDocumentFormValues, string>>;
  ok?: true;
};

const documentRoles = ["ADMIN", "CONSULTANT"] as const;

function toFieldErrors(error: z.ZodError<AuditDocumentFormValues>) {
  const flattened = error.flatten().fieldErrors;
  const fieldErrors: AuditDocumentActionState["fieldErrors"] = {};

  for (const [field, messages] of Object.entries(flattened)) {
    const message = messages?.[0];
    if (message) fieldErrors[field as keyof AuditDocumentFormValues] = message;
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

export async function createAuditDocumentAction(
  values: AuditDocumentFormValues,
): Promise<AuditDocumentActionState> {
  const context = await getContext(documentRoles);

  if (isError(context)) return context;

  const parsed = auditDocumentSchema.safeParse(values);

  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  try {
    const document = await createAuditDocumentForOrganization({
      organizationId: context.organizationId,
      userId: context.userId,
      values: parsed.data,
    });

    if (!document) return { error: "Auditoria nao encontrada." };

    await NotificationService.notifyDocumentCreated(document.id);

    revalidatePath(`/audits/${document.auditId}`);
    revalidatePath("/notifications");
    return { ok: true };
  } catch {
    return { error: "Nao foi possivel anexar o documento." };
  }
}

export async function deleteAuditDocumentAction({
  auditId,
  documentId,
}: {
  auditId: string;
  documentId: string;
}): Promise<AuditDocumentActionState> {
  const context = await getContext(documentRoles);

  if (isError(context)) return context;

  try {
    const deleted = await deleteAuditDocumentForOrganization({
      auditId,
      documentId,
      organizationId: context.organizationId,
      userId: context.userId,
    });

    if (!deleted) return { error: "Documento nao encontrado." };

    revalidatePath(`/audits/${auditId}`);
    return { ok: true };
  } catch {
    return { error: "Nao foi possivel remover o documento." };
  }
}
