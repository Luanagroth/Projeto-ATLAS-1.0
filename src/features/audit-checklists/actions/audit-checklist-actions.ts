"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { revalidatePath } from "next/cache";

import { hasRole, requireAuth } from "@/auth";

import { logAuditEvent } from "@/features/audits/services/audit-service";
import { NotificationService } from "@/features/notifications/services/notification-service";

import {
  applyChecklistSchema,
  saveChecklistResponsesSchema,
  type ApplyChecklistValues,
  type SaveChecklistResponsesValues,
} from "../schemas/audit-checklist-schema";
import {
  applyChecklistTemplateToAudit,
  saveChecklistResponses,
} from "../services/audit-checklist-service";

type AuditChecklistActionState = {
  error?: string;
  success?: string;
};

type ChecklistEvidenceUploadState = {
  error?: string;
  fileName?: string;
  success?: string;
  url?: string;
};

const checklistExecutionRoles = ["ADMIN", "CONSULTANT"] as const;

async function getExecutionContext(): Promise<
  | {
      organizationId: string;
      userId: string;
    }
  | AuditChecklistActionState
> {
  const user = await requireAuth();

  if (!user.organizationId) {
    return {
      error: "Seu usuário não está vinculado a uma organização.",
    };
  }

  if (!hasRole(user, checklistExecutionRoles)) {
    return {
      error: "Seu perfil não tem permissão para executar checklists.",
    };
  }

  return {
    organizationId: user.organizationId,
    userId: user.id,
  };
}

function isActionError(
  value: Awaited<ReturnType<typeof getExecutionContext>>,
): value is AuditChecklistActionState {
  return "error" in value;
}

export async function applyChecklistToAuditAction(
  values: ApplyChecklistValues,
): Promise<AuditChecklistActionState> {
  const context = await getExecutionContext();

  if (isActionError(context)) {
    return context;
  }

  const parsed = applyChecklistSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: "Selecione um modelo de checklist valido.",
    };
  }

  const result = await applyChecklistTemplateToAudit({
    auditId: parsed.data.auditId,
    checklistId: parsed.data.checklistId,
    organizationId: context.organizationId,
  });

  if ("error" in result) {
    return {
      error: result.error,
    };
  }

  revalidatePath(`/audits/${parsed.data.auditId}`);

  // Registra evento no histórico da auditoria
  try {
    await logAuditEvent({
      auditId: parsed.data.auditId,
      organizationId: context.organizationId,
      action: "CHECKLIST_APPLIED",
      entity: "AUDIT_CHECKLIST",
    });
  } catch {
    // Log não crítico — não bloqueia o fluxo
  }

  return {
    success: "Checklist aplicado com sucesso.",
  };
}

export async function saveAuditChecklistResponsesAction(
  values: SaveChecklistResponsesValues,
): Promise<AuditChecklistActionState> {
  const context = await getExecutionContext();

  if (isActionError(context)) {
    return context;
  }

  const parsed = saveChecklistResponsesSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: "Revise as respostas do checklist.",
    };
  }

  try {
    const result = await saveChecklistResponses({
      organizationId: context.organizationId,
      respondentId: context.userId,
      updatedById: context.userId,
      values: parsed.data,
    });

    if ("error" in result) {
      return {
        error: result.error,
      };
    }

    await NotificationService.notifyPossibleIrregularities({
      auditId: parsed.data.auditId,
      count: result.possibleIrregularities,
      organizationId: context.organizationId,
    });
  } catch {
    return {
      error: "Não foi possível salvar as respostas. Tente novamente.",
    };
  }

  revalidatePath(`/audits/${parsed.data.auditId}`);
  revalidatePath("/notifications");

  return {
    success: "Respostas salvas com sucesso.",
  };
}

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export async function uploadChecklistEvidenceAction(
  formData: FormData,
): Promise<ChecklistEvidenceUploadState> {
  const context = await getExecutionContext();

  if (isActionError(context)) {
    return {
      error: context.error,
    };
  }

  const auditId = String(formData.get("auditId") ?? "").trim();
  const auditChecklistItemId = String(
    formData.get("auditChecklistItemId") ?? "",
  ).trim();
  const file = formData.get("file");

  if (!auditId || !auditChecklistItemId) {
    return {
      error: "Checklist ou auditoria invalidos para upload.",
    };
  }

  if (!(file instanceof File) || file.size === 0) {
    return {
      error: "Selecione um arquivo para anexar.",
    };
  }

  const maxSizeInBytes = 15 * 1024 * 1024;

  if (file.size > maxSizeInBytes) {
    return {
      error: "O arquivo deve ter no maximo 15 MB.",
    };
  }

  const extension = path.extname(file.name);
  const baseName = path.basename(file.name, extension);
  const safeName = sanitizeFileName(baseName || "evidencia");
  const uniqueName = `${auditId}-${auditChecklistItemId}-${randomUUID()}${extension.toLowerCase()}`;
  const finalFileName = `${safeName || "evidencia"}-${uniqueName}`;
  const uploadsDirectory = path.join(
    process.cwd(),
    "public",
    "uploads",
    "checklist-evidences",
  );

  await mkdir(uploadsDirectory, { recursive: true });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const absoluteFilePath = path.join(uploadsDirectory, finalFileName);

  await writeFile(absoluteFilePath, buffer);

  return {
    fileName: file.name,
    success: "Arquivo carregado com sucesso.",
    url: `/uploads/checklist-evidences/${finalFileName}`,
  };
}
