"use client";

import { Bell, Check, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { markNotificationReadAction } from "../actions/notification-actions";
import { notificationTypeLabels } from "../notification-types";
import type { NotificationListItem } from "../services/notification-service";

type NotificationListProps = {
  items: NotificationListItem[];
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function NotificationCard({ item }: { item: NotificationListItem }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function markAsRead() {
    if (isPending) return;

    startTransition(async () => {
      const result = await markNotificationReadAction(item.id);

      if (result?.error) return;

      router.refresh();
    });
  }

  return (
    <article
      className={`relative rounded-xl border bg-card p-4 shadow-sm transition-colors ${
        item.read ? "" : "border-[color:rgba(245,158,11,0.24)] bg-[color:rgba(245,158,11,0.04)]"
      }`}
    >
      {item.href ? (
        <Link
          className="flex w-full items-start gap-3 rounded-md text-left outline-none transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          href={item.href}
          onClick={() => markAsRead()}
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-50">
            <Bell className="size-5 text-slate-700" />
          </div>
          <div className="min-w-0 flex-1 pr-10">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">{item.title}</h2>
              {!item.read ? (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                  Nova
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{item.message}</p>
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              {notificationTypeLabels[item.type] ?? item.type}
            </p>
            <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="size-4" />
              {formatDateTime(item.createdAt)}
            </p>
          </div>
        </Link>
      ) : (
        <button
          className="flex w-full items-start gap-3 rounded-md text-left outline-none transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={() => markAsRead()}
          type="button"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-50">
            <Bell className="size-5 text-slate-700" />
          </div>
          <div className="min-w-0 flex-1 pr-10">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">{item.title}</h2>
              {!item.read ? (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                  Nova
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{item.message}</p>
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              {notificationTypeLabels[item.type] ?? item.type}
            </p>
            <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="size-4" />
              {formatDateTime(item.createdAt)}
            </p>
          </div>
        </button>
      )}

      <div className="absolute right-4 top-4 flex items-center gap-2">
        {!item.read ? (
          <Button
            aria-label="Marcar como lida"
            className="h-8 w-8"
            disabled={isPending}
            onClick={(event) => {
              event.stopPropagation();
              markAsRead();
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            <Check className="size-4" />
          </Button>
        ) : null}
      </div>
    </article>
  );
}

export function NotificationList({ items }: NotificationListProps) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <NotificationCard item={item} key={item.id} />
      ))}
    </div>
  );
}
