import { redirect } from "next/navigation";

import { requireAuth } from "@/auth";
import { MarkAllNotificationsReadButton } from "@/features/notifications/components/mark-all-notifications-read-button";
import { NotificationList } from "@/features/notifications/components/notification-list";
import { NotificationsEmptyState } from "@/features/notifications/components/notifications-empty-state";
import {
  countUnreadNotificationsForUser,
  listNotificationsForUser,
} from "@/features/notifications/services/notification-service";

export default async function NotificationsPage() {
  const user = await requireAuth();
  if (!user.organizationId) redirect("/dashboard");

  const [items, unreadCount] = await Promise.all([
    listNotificationsForUser({
      organizationId: user.organizationId,
      userId: user.id,
    }),
    countUnreadNotificationsForUser({
      organizationId: user.organizationId,
      userId: user.id,
    }),
  ]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notificacoes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe eventos importantes de não conformidades e planos de ação.
          </p>
        </div>
        {unreadCount > 0 ? <MarkAllNotificationsReadButton /> : null}
      </div>
      {items.length > 0 ? (
        <NotificationList items={items} />
      ) : (
        <NotificationsEmptyState />
      )}
    </section>
  );
}
