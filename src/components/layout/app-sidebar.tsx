"use client";

import {
  Bell,
  Building2,
  ClipboardCheck,
  LayoutDashboard,
  ListChecks,
  ListTodo,
  Settings,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navigationItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Empresas", href: "/companies", icon: Building2 },
  { label: "Auditorias", href: "/audits", icon: ClipboardCheck },
  { label: "Modelos de Checklist", href: "/checklists", icon: ListChecks },
  { label: "Não Conformidades", href: "/non-conformities", icon: TriangleAlert },
  { label: "Planos de Ação", href: "/action-plans", icon: ListTodo },
  { label: "Notificacoes", href: "/notifications", icon: Bell },
  { label: "Configurações", href: "/settings", icon: Settings },
];

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-b bg-sidebar text-sidebar-foreground lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
      <div className="flex h-16 items-center border-b px-4">
        <div>
          <p className="text-lg font-semibold tracking-tight">Atlas</p>
          <p className="text-xs text-muted-foreground">Auditorias B2B</p>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:overflow-visible">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActiveRoute(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active && "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
