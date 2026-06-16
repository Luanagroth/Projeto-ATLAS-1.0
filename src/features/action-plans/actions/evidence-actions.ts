"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { hasRole, requireAuth } from "@/auth";
import { NotificationService } from "@/features/notifications/services/notification-service";
import type { AppRole } from "@/lib/auth-utils";

import {
  evidenceReviewSchema,
  evidenceSchema,
  type EvidenceFormValues,
  type EvidenceReviewValues,
} from "../schemas/evidence-schema";
import {
  createEvidenceForActionPlan,
  reviewEvidenceForOrganization,
} from "../services/evidence-service";

type EvidenceActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof EvidenceFormValues, string>>;
};

type EvidenceReviewActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof EvidenceReviewValues, string>>;
};

const attachRoles = ["ADMIN", "CONSULTANT", "CLIENT"] as const;
const reviewRoles = ["ADMIN", "CONSULTANT"] as const;

function formErrors<T extends Record<string, unknown>>(error: z.ZodError<T>) {
  const flattened = error.flatten().fieldErrors;
  const fieldErrors: Partial<Record<keyof T, string>> = {};

  for (const [field, messages] of Object.entries(flattened)) {
    const message = messages?.[0];

    if (message) {
      fieldErrors[field as keyof T] = message;
    }
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

export async function createEvidenceAction(
  values: EvidenceFormValues,
): Promise<EvidenceActionState | { ok: true }> {
  const context = await getContext(attachRoles);

  if (isError(context)) {
    return context;
  }

  const parsed = evidenceSchema.safeParse(values);

  if (!parsed.success) {
    return { fieldErrors: formErrors(parsed.error) };
  }

  try {
    const evidence = await createEvidenceForActionPlan({
      organizationId: context.organizationId,
      userId: context.userId,
      values: parsed.data,
    });

    if (!evidence) {
      return { error: "Plano de acao nao encontrado." };
    }

    await NotificationService.notifyEvidenceCreated(evidence.id);

    revalidatePath(`/action-plans/${evidence.actionPlanId}`);
    revalidatePath(`/audits/${evidence.auditId}`);
    revalidatePath("/notifications");

    return { ok: true };
  } catch {
    return { error: "Nao foi possivel anexar a evidencia." };
  }
}

export async function reviewEvidenceAction(
  values: EvidenceReviewValues,
): Promise<EvidenceReviewActionState | { ok: true }> {
  const context = await getContext(reviewRoles);

  if (isError(context)) {
    return context;
  }

  const parsed = evidenceReviewSchema.safeParse(values);

  if (!parsed.success) {
    return { fieldErrors: formErrors(parsed.error) };
  }

  try {
    const reviewed = await reviewEvidenceForOrganization({
      organizationId: context.organizationId,
      userId: context.userId,
      values: parsed.data,
    });

    if (!reviewed) {
      return { error: "Evidencia nao encontrada." };
    }

    await NotificationService.notifyEvidenceReview({
      evidenceId: parsed.data.evidenceId,
      status: parsed.data.status,
    });

    revalidatePath(`/action-plans/${reviewed.actionPlanId}`);
    revalidatePath(`/audits/${reviewed.auditId}`);
    revalidatePath("/notifications");

    return { ok: true };
  } catch {
    return { error: "Nao foi possivel revisar a evidencia." };
  }
}
