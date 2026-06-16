import { redirect } from "next/navigation";

import { requireAuth } from "@/auth";
import { NonConformitiesEmptyState } from "@/features/non-conformities/components/non-conformities-empty-state";
import { NonConformityIndicators } from "@/features/non-conformities/components/non-conformity-indicators";
import { NonConformitiesList } from "@/features/non-conformities/components/non-conformities-list";
import {
  getNonConformityIndicators,
  listNonConformitiesByOrganization,
} from "@/features/non-conformities/services/non-conformity-service";

type NonConformitiesPageProps = {
  searchParams?: Promise<{ deleted?: string }>;
};

export default async function NonConformitiesPage({
  searchParams,
}: NonConformitiesPageProps) {
  const user = await requireAuth();
  if (!user.organizationId) redirect("/dashboard");

  const [items, indicators, feedback] = await Promise.all([
    listNonConformitiesByOrganization(user.organizationId),
    getNonConformityIndicators(user.organizationId),
    searchParams,
  ]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Não Conformidades</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe registros manuais encontrados durante auditorias.
        </p>
      </div>
      {feedback?.deleted === "1" ? (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          Não conformidade excluída com sucesso.
        </p>
      ) : null}
      <NonConformityIndicators indicators={indicators} />
      {items.length > 0 ? (
        <NonConformitiesList items={items} />
      ) : (
        <NonConformitiesEmptyState />
      )}
    </section>
  );
}
