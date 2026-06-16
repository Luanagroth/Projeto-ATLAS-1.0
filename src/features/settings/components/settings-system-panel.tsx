import {
  Bell,
  Building2,
  ClipboardCheck,
  FolderKanban,
  TriangleAlert,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

import type { SettingsMetrics } from "../services/settings-service";

type SettingsSystemPanelProps = {
  metrics: SettingsMetrics;
};

const summaryItems = [
  { key: "users", label: "Usuários", icon: UsersRound, href: "/settings" },
  { key: "companies", label: "Empresas", icon: Building2, href: "/companies" },
  { key: "audits", label: "Auditorias", icon: ClipboardCheck, href: "/audits" },
  {
    key: "nonConformitiesOpen",
    label: "NCs em aberto",
    icon: TriangleAlert,
    href: "/non-conformities",
  },
  {
    key: "actionPlansAwaitingReview",
    label: "Planos aguardando revisão",
    icon: FolderKanban,
    href: "/action-plans",
  },
  {
    key: "unreadNotifications",
    label: "Notificações não lidas",
    icon: Bell,
    href: "/notifications",
  },
] as const;

export function SettingsSystemPanel({ metrics }: SettingsSystemPanelProps) {
  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-2 border-b pb-4">
        <h2 className="text-base font-semibold">Sistema</h2>
        <p className="text-sm text-muted-foreground">
          Resumo operacional para acompanhar volume, pendências e pontos de atenção sem poluir a
          tela.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {summaryItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              className="rounded-md border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
              href={item.href}
              key={item.key}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <p className="mt-3 text-2xl font-semibold">{metrics[item.key]}</p>
            </Link>
          );
        })}
      </div>

    </section>
  );
}
