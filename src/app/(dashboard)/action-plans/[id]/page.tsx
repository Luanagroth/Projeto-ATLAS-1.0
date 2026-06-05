import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { hasRole, requireAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { DeleteActionPlanButton } from "@/features/action-plans/components/delete-action-plan-button";
import { ActionPlanDetailsCard } from "@/features/action-plans/components/action-plan-details-card";
import { ActionPlanHistory } from "@/features/action-plans/components/action-plan-history";
import { ActionPlanStatusActions } from "@/features/action-plans/components/action-plan-status-actions";
import { getActionPlanByIdForOrganization } from "@/features/action-plans/services/action-plan-service";

type ActionPlanPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    created?: string;
    status?: string;
    updated?: string;
  }>;
};

const editorRoles = ["ADMIN", "CONSULTANT"] as const;
const deleteRoles = ["ADMIN"] as const;

export default async function ActionPlanPage({
  params,
  searchParams,
}: ActionPlanPageProps) {
  const user = await requireAuth();
  if (!user.organizationId) redirect("/dashboard");

  const { id } = await params;
  const item = await getActionPlanByIdForOrganization({
    id,
    organizationId: user.organizationId,
  });
  if (!item) notFound();

  const feedback = await searchParams;
  const success =
    feedback?.created === "1"
      ? "Plano de ação criado com sucesso."
      : feedback?.updated === "1"
        ? "Plano de ação atualizado com sucesso."
        : feedback?.status === "1"
          ? "Status do plano atualizado com sucesso."
          : null;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Planos de ação
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{item.title}</h1>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/action-plans">Voltar</Link>
          </Button>
          {hasRole(user, editorRoles) ? (
            <Button asChild>
              <Link href={`/action-plans/${item.id}/edit`}>Editar</Link>
            </Button>
          ) : null}
          {hasRole(user, deleteRoles) ? (
            <DeleteActionPlanButton id={item.id} title={item.title} />
          ) : null}
        </div>
      </div>
      {success ? (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}
      <ActionPlanStatusActions id={item.id} role={user.role} status={item.status} />
      <ActionPlanDetailsCard item={item} />
      <ActionPlanHistory history={item.history} />
    </section>
  );
}
