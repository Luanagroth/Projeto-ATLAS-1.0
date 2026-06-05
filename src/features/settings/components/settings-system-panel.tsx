import {
  Bell,
  Building2,
  ClipboardCheck,
  ListChecks,
  ListTodo,
  TriangleAlert,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

import type { SettingsMetrics } from "../services/settings-service";

type SettingsSystemPanelProps = {
  metrics: SettingsMetrics;
};

const metricItems = [
  { key: "users", label: "Usuários", icon: UsersRound, href: "/settings" },
  { key: "companies", label: "Empresas", icon: Building2, href: "/companies" },
  { key: "audits", label: "Auditorias", icon: ClipboardCheck, href: "/audits" },
  { key: "checklistTemplates", label: "Modelos", icon: ListChecks, href: "/checklists" },
  { key: "appliedChecklists", label: "Modelos aplicados", icon: ListChecks, href: "/checklists" },
  { key: "nonConformitiesOpen", label: "NCs abertas", icon: TriangleAlert, href: "/non-conformities" },
  { key: "nonConformitiesTotal", label: "NCs totais", icon: TriangleAlert, href: "/non-conformities" },
  { key: "actionPlansOpen", label: "Planos abertos", icon: ListTodo, href: "/action-plans" },
  { key: "actionPlansAwaitingReview", label: "Aguardando revisao", icon: ListTodo, href: "/action-plans" },
  { key: "actionPlansApproved", label: "Planos aprovados", icon: ListTodo, href: "/action-plans" },
  { key: "unreadNotifications", label: "Notificações não lidas", icon: Bell, href: "/notifications" },
] as const;

export function SettingsSystemPanel({ metrics }: SettingsSystemPanelProps) {
  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <div>
        <h2 className="text-base font-semibold">Metricas do sistema</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão operacional baseada nos dados reais da organização.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metricItems.map((item) => {
          const Icon = item.icon;

          const content = (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">
                  {item.label}
                </p>
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <p className="mt-3 text-2xl font-semibold">{metrics[item.key]}</p>
            </>
          );

          return (
            <Link
              className="rounded-md border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
              href={item.href}
              key={item.key}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
