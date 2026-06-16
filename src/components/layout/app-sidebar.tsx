"use client";

import { usePathname } from "next/navigation";

import type { AppRole } from "@/lib/auth-utils";
import { getNavigationItemsForRole } from "@/lib/access-policy";
import { cn } from "@/lib/utils";

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({
  role,
  unreadNotifications = 0,
}: {
  role: AppRole;
  unreadNotifications?: number;
}) {
  const pathname = usePathname();
  const navigationItems = getNavigationItemsForRole(role);

  return (
    <aside className="border-b border-sidebar-border bg-sidebar text-sidebar-foreground lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
      <div className="border-b border-sidebar-border px-4 py-3 sm:px-5 lg:px-4 lg:py-5">
        <p className="text-lg font-semibold tracking-[0.08em] text-sidebar-primary">ATLAS</p>
        <p className="text-xs text-white/72">Auditorias B2B</p>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 py-3 lg:flex-col lg:overflow-visible">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActiveRoute(pathname, item.href);

          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium text-white/82 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active &&
                  "bg-sidebar-accent text-[color:var(--atlas-accent)] ring-1 ring-[color:rgba(245,158,11,0.22)]",
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
              {item.href === "/notifications" && unreadNotifications > 0 ? (
                <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
              ) : null}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
