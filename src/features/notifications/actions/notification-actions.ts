"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/auth";

import {
  markAllNotificationsAsReadForUser,
  markNotificationAsReadForUser,
} from "../services/notification-service";

type NotificationActionState = {
  error?: string;
};

async function getContext() {
  const user = await requireAuth();

  if (!user.organizationId) {
    return { error: "Seu usuário não está vinculado a uma organização." };
  }

  return { organizationId: user.organizationId, userId: user.id };
}

function isError(value: Awaited<ReturnType<typeof getContext>>): value is {
  error: string;
} {
  return "error" in value;
}

export async function markNotificationReadAction(
  id: string,
): Promise<NotificationActionState | void> {
  const context = await getContext();

  if (isError(context)) {
    return context;
  }

  const updated = await markNotificationAsReadForUser({
    id,
    organizationId: context.organizationId,
    userId: context.userId,
  });

  if (!updated) {
    return { error: "Notificação não encontrada." };
  }

  revalidatePath("/notifications");
}

export async function markAllNotificationsReadAction(): Promise<
  NotificationActionState | void
> {
  const context = await getContext();

  if (isError(context)) {
    return context;
  }

  await markAllNotificationsAsReadForUser({
    organizationId: context.organizationId,
    userId: context.userId,
  });

  revalidatePath("/notifications");
}
