import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { hasRole, requireAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { NonConformityActionPlansPanel } from "@/features/action-plans/components/non-conformity-action-plans-panel";
import { listActionPlansForNonConformity } from "@/features/action-plans/services/action-plan-service";
import { NonConformityDetailsCard } from "@/features/non-conformities/components/non-conformity-details-card";
import { DeleteNonConformityButton } from "@/features/non-conformities/components/delete-non-conformity-button";
import { ResolveNonConformityButton } from "@/features/non-conformities/components/resolve-non-conformity-button";
import { getNonConformityByIdForOrganization } from "@/features/non-conformities/services/non-conformity-service";

type NonConformityPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ created?: string; resolved?: string; updated?: string; from?: string }>;
};

const editorRoles = ["ADMIN", "CONSULTANT"] as const;
const closerRoles = ["ADMIN"] as const;
const deleteRoles = ["ADMIN"] as const;

export default async function NonConformityPage({
  params,
  searchParams,
}: NonConformityPageProps) {
  const user = await requireAuth();
  if (!user.organizationId) redirect("/dashboard");

  const { id } = await params;
  const item = await getNonConformityByIdForOrganization({
    id,
    organizationId: user.organizationId,
  });
  if (!item) notFound();
  const actionPlans = await listActionPlansForNonConformity({
    nonConformityId: item.id,
    organizationId: user.organizationId,
  });

  const feedback = await searchParams;
  const fromAuditId = feedback?.from;
  const success =
    feedback?.created === "1"
      ? "Não conformidade criada com sucesso."
      : feedback?.updated === "1"
        ? "Não conformidade atualizada com sucesso."
        : feedback?.resolved === "1"
          ? "Não conformidade resolvida com sucesso."
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
              "Não Conformidades"
            )}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{item.title}</h1>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button asChild className="w-full sm:w-auto" variant="outline">
            <Link href={fromAuditId ? `/audits/${fromAuditId}` : "/non-conformities"}>Voltar</Link>
          </Button>
          {hasRole(user, closerRoles) && item.status !== "RESOLVED" ? (
            <ResolveNonConformityButton
              id={item.id}
              returnTo={fromAuditId ? `/audits/${fromAuditId}` : undefined}
            />
          ) : null}
          {hasRole(user, editorRoles) ? (
            <Button asChild className="w-full sm:w-auto">
              <Link href={`/non-conformities/${item.id}/edit${fromAuditId ? `?from=${fromAuditId}` : ""}`}>Editar</Link>
            </Button>
          ) : null}
          {hasRole(user, deleteRoles) ? (
            <DeleteNonConformityButton
              id={item.id}
              returnTo={fromAuditId ? `/audits/${fromAuditId}` : undefined}
              title={item.title}
            />
          ) : null}
        </div>
      </div>
      {success ? <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}
      <NonConformityDetailsCard item={item} />
      <NonConformityActionPlansPanel
        canCreate={hasRole(user, editorRoles)}
        items={actionPlans}
        nonConformityId={item.id}
      />
    </section>
  );
}
