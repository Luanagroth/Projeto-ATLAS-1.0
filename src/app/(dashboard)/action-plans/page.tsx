import { redirect } from "next/navigation";

import { requireAuth } from "@/auth";
import { ActionPlanIndicators } from "@/features/action-plans/components/action-plan-indicators";
import { ActionPlansEmptyState } from "@/features/action-plans/components/action-plans-empty-state";
import { ActionPlansList } from "@/features/action-plans/components/action-plans-list";
import {
  getActionPlanIndicators,
  listActionPlansByOrganization,
} from "@/features/action-plans/services/action-plan-service";

type ActionPlansPageProps = {
  searchParams?: Promise<{ deleted?: string }>;
};

export default async function ActionPlansPage({
  searchParams,
}: ActionPlansPageProps) {
  const user = await requireAuth();
  if (!user.organizationId) redirect("/dashboard");

  const [items, indicators, feedback] = await Promise.all([
    listActionPlansByOrganization(user.organizationId),
    getActionPlanIndicators(user.organizationId),
    searchParams,
  ]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Planos de ação</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe tarefas corretivas vinculadas às não conformidades.
        </p>
      </div>
      {feedback?.deleted === "1" ? (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          Plano de ação excluído com sucesso.
        </p>
      ) : null}
      <ActionPlanIndicators indicators={indicators} />
      {items.length > 0 ? <ActionPlansList items={items} /> : <ActionPlansEmptyState />}
    </section>
  );
}
