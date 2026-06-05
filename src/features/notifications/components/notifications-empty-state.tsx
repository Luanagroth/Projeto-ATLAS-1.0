import { Bell } from "lucide-react";

export function NotificationsEmptyState() {
  return (
    <div className="rounded-lg border border-dashed bg-card p-8 text-center shadow-sm">
      <div className="mx-auto flex size-12 items-center justify-center rounded-md bg-muted">
        <Bell className="size-6 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">Nenhuma notificação</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Eventos importantes de não conformidades e planos de ação aparecerão aqui.
      </p>
    </div>
  );
}
