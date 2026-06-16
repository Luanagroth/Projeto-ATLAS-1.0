import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { hasRole, requireAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { DeleteActionPlanButton } from "@/features/action-plans/components/delete-action-plan-button";
import { ActionPlanDetailsCard } from "@/features/action-plans/components/action-plan-details-card";
import { ActionPlanEvidencesPanel } from "@/features/action-plans/components/action-plan-evidences-panel";
import { ActionPlanHistory } from "@/features/action-plans/components/action-plan-history";
import { ActionPlanStatusActions } from "@/features/action-plans/components/action-plan-status-actions";
import { getActionPlanByIdForOrganization } from "@/features/action-plans/services/action-plan-service";

type ActionPlanPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    created?: string;
    status?: string;
    updated?: string;
    from?: string;
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
  const fromAuditId = feedback?.from;
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
            {fromAuditId ? (
              <Link className="hover:underline" href={`/audits/${fromAuditId}`}>
                ← Voltar para auditoria
              </Link>
            ) : (
              "Planos de ação"
            )}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{item.title}</h1>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button asChild className="w-full sm:w-auto" variant="outline">
            <Link href={fromAuditId ? `/audits/${fromAuditId}` : "/action-plans"}>Voltar</Link>
          </Button>
          {hasRole(user, editorRoles) ? (
            <Button asChild className="w-full sm:w-auto">
              <Link href={`/action-plans/${item.id}/edit${fromAuditId ? `?from=${fromAuditId}` : ""}`}>Editar</Link>
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
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Fluxo do plano</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {user.role === "CLIENT"
            ? "Atualize a execucao e envie a resposta da empresa para revisao da auditora."
            : "Revise o retorno da empresa, aprove quando a correcao estiver adequada ou reprove para pedir ajustes."}
        </p>
        <div className="mt-4">
          <ActionPlanStatusActions
            id={item.id}
            role={user.role}
            status={item.status}
          />
        </div>
      </section>
      <ActionPlanDetailsCard item={item} />
      <ActionPlanEvidencesPanel
        canReview={hasRole(user, editorRoles)}
        item={item}
      />
      <ActionPlanHistory history={item.history} />
    </section>
  );
}
