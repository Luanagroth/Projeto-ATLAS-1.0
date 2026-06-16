import Link from "next/link";
import { redirect } from "next/navigation";

import { requireAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { MarkAllNotificationsReadButton } from "@/features/notifications/components/mark-all-notifications-read-button";
import { NotificationList } from "@/features/notifications/components/notification-list";
import { NotificationsEmptyState } from "@/features/notifications/components/notifications-empty-state";
import {
  countUnreadNotificationsForUser,
  listNotificationsForUser,
  notificationTypeLabels,
  notificationTypeOptions,
  syncOperationalNotificationsForUser,
} from "@/features/notifications/services/notification-service";

type NotificationsPageProps = {
  searchParams?: Promise<{
    read?: string;
    type?: string;
  }>;
};

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const user = await requireAuth();
  if (!user.organizationId) redirect("/dashboard");

  const filters = await searchParams;

  await syncOperationalNotificationsForUser({
    organizationId: user.organizationId,
    userId: user.id,
  });

  const [items, unreadCount] = await Promise.all([
    listNotificationsForUser({
      filters,
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
          <h1 className="text-2xl font-semibold tracking-tight">Notificações</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe prazos, evidências, pareceres e alterações operacionais.
          </p>
        </div>
        {unreadCount > 0 ? <MarkAllNotificationsReadButton className="w-full sm:w-auto" /> : null}
      </div>

      <form className="grid gap-3 rounded-lg border bg-card p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto]">
        <label className="grid gap-1 text-sm font-medium">
          Status
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            defaultValue={filters?.read ?? ""}
            name="read"
          >
            <option value="">Todas</option>
            <option value="unread">Não lidas</option>
            <option value="read">Lidas</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Tipo
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            defaultValue={filters?.type ?? ""}
            name="type"
          >
            <option value="">Todos os tipos</option>
            {notificationTypeOptions.map((type) => (
              <option key={type} value={type}>
                {notificationTypeLabels[type]}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2 sm:gap-3">
          <Button className="w-full sm:w-auto" type="submit">
            Filtrar
          </Button>
          <Button asChild className="w-full sm:w-auto" variant="outline">
            <Link href="/notifications">Limpar</Link>
          </Button>
        </div>
      </form>

      {items.length > 0 ? (
        <NotificationList items={items} />
      ) : (
        <NotificationsEmptyState />
      )}
    </section>
  );
}
