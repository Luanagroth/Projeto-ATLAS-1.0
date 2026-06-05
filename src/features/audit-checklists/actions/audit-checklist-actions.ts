"use server";

import { revalidatePath } from "next/cache";

import { hasRole, requireAuth } from "@/auth";

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
  } catch {
    return {
      error: "Não foi possível salvar as respostas. Tente novamente.",
    };
  }

  revalidatePath(`/audits/${parsed.data.auditId}`);

  return {
    success: "Respostas salvas com sucesso.",
  };
}
