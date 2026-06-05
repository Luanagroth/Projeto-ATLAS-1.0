import { dashboardStats } from "@/features/dashboard/data/mock-dashboard";

import { StatCard } from "./stat-card";

export function DashboardOverview() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão inicial da operação no Atlas.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="text-base font-semibold">Atividade recente</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          As próximas etapas do Atlas vão preencher esta área com dados reais de
          auditorias e conformidade.
        </p>
      </div>
    </section>
  );
}
