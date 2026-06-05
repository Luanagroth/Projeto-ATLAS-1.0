import { Bell, Clock } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import type { NotificationListItem } from "../services/notification-service";
import { MarkNotificationReadButton } from "./mark-notification-read-button";

type NotificationListProps = {
  items: NotificationListItem[];
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function NotificationContent({ item }: { item: NotificationListItem }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
        <Bell className="size-5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">{item.title}</h2>
              {!item.read ? (
                <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                  Nova
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{item.message}</p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            {item.href ? (
              <Button asChild size="sm" variant="outline">
                <Link href={item.href}>Abrir</Link>
              </Button>
            ) : null}
            {!item.read ? <MarkNotificationReadButton id={item.id} /> : null}
          </div>
        </div>
        <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="size-4" />
          {formatDateTime(item.createdAt)}
        </p>
      </div>
    </div>
  );
}

export function NotificationList({ items }: NotificationListProps) {
  return (
    <div className="grid gap-3">
      {items.map((item) => {
        const className = `rounded-lg border bg-card p-4 shadow-sm ${
          item.read ? "" : "border-primary/30 bg-primary/5"
        }`;

        return (
          <div className={className} key={item.id}>
            <NotificationContent item={item} />
          </div>
        );
      })}
    </div>
  );
}
