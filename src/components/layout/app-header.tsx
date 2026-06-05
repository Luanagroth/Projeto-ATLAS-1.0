"use client";

import { Bell, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type HeaderNotificationItem = {
  createdAt: Date;
  href: string | null;
  id: string;
  message: string;
  read: boolean;
  title: string;
};

type AppHeaderProps = {
  recentNotifications: HeaderNotificationItem[];
  unreadNotifications: number;
  userName: string;
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function AppHeader({
  recentNotifications,
  unreadNotifications,
  userName,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Atlas</p>
        <h1 className="text-base font-semibold">Painel de controle</h1>
      </div>
      <div className="flex items-center gap-3">
        <details className="relative">
          <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:bg-muted [&::-webkit-details-marker]:hidden">
            <Bell className="size-4" />
            {unreadNotifications > 0 ? (
              <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </span>
            ) : null}
          </summary>
          <div className="absolute right-0 mt-2 w-80 rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Notificacoes</p>
              <Link className="text-sm font-medium text-primary hover:underline" href="/notifications">
                Ver todas
              </Link>
            </div>
            {recentNotifications.length > 0 ? (
              <div className="mt-3 space-y-2">
                {recentNotifications.map((item) => {
                  const content = (
                    <div className="rounded-md border bg-background p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{item.title}</p>
                        {!item.read ? (
                          <span className="mt-1 size-2 rounded-full bg-primary" />
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {item.message}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatDateTime(item.createdAt)}
                      </p>
                    </div>
                  );

                  return item.href ? (
                    <Link href={item.href} key={item.id}>
                      {content}
                    </Link>
                  ) : (
                    <div key={item.id}>{content}</div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 rounded-md border border-dashed bg-background p-3 text-sm text-muted-foreground">
                Nenhuma notificação recente.
              </p>
            )}
          </div>
        </details>
        <span className="hidden max-w-48 truncate text-sm text-muted-foreground sm:block">
          {userName}
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut />
          Sair
        </Button>
      </div>
    </header>
  );
}
