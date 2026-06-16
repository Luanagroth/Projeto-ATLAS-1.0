import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { hasRole, requireAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { ActionPlanForm } from "@/features/action-plans/components/action-plan-form";
import {
  getNonConformityOptionForOrganization,
  listNonConformityOptionsForAudit,
  listOrganizationUserOptions,
} from "@/features/action-plans/services/action-plan-service";
import { getAuditByIdForOrganization } from "@/features/audits/services/audit-service";

type NewAuditActionPlanPageProps = {
  params: Promise<{ auditId: string }>;
  searchParams?: Promise<{ ncId?: string }>;
};

const editorRoles = ["ADMIN", "CONSULTANT"] as const;

export default async function NewAuditActionPlanPage({
  params,
  searchParams,
}: NewAuditActionPlanPageProps) {
  const user = await requireAuth();
  if (!user.organizationId) redirect("/dashboard");
  if (!hasRole(user, editorRoles)) redirect("/action-plans");

  const { auditId } = await params;
  const query = await searchParams;
  const selectedNcId = query?.ncId;

  const audit = await getAuditByIdForOrganization({
    auditId,
    organizationId: user.organizationId,
  });
  if (!audit) notFound();

  // Se um ncId foi fornecido, tenta carregar direto para o form
  if (selectedNcId) {
    const [nonConformity, users] = await Promise.all([
      getNonConformityOptionForOrganization({
        id: selectedNcId,
        organizationId: user.organizationId,
      }),
      listOrganizationUserOptions(user.organizationId),
    ]);

    if (!nonConformity) notFound();

    return (
      <section className="mx-auto max-w-4xl space-y-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            <Link className="hover:underline" href="/audits">
              Auditorias
            </Link>
            {" / "}
            <Link
              className="hover:underline"
              href={`/audits/${auditId}`}
            >
              {audit.title}
            </Link>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Novo plano de ação
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie tarefas corretivas para{" "}
            <strong>{nonConformity.title}</strong>.
          </p>
        </div>
        <ActionPlanForm
          cancelHref={`/audits/${auditId}`}
          fixedNonConformity={nonConformity}
          mode="create"
          returnTo={`/audits/${auditId}`}
          userOptions={users}
        />
      </section>
    );
  }

  // Sem ncId: lista as NCs da auditoria para seleção
  const nonConformities = await listNonConformityOptionsForAudit({
    auditId,
    organizationId: user.organizationId,
  });

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          <Link className="hover:underline" href="/audits">
            Auditorias
          </Link>
          {" / "}
          <Link className="hover:underline" href={`/audits/${auditId}`}>
            {audit.title}
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Novo plano de ação
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Selecione a não conformidade que este plano irá corrigir.
        </p>
      </div>

      {nonConformities.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-8 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Nenhuma não conformidade registrada nesta auditoria.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Registre uma não conformidade antes de criar um plano de ação.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link href={`/audits/${auditId}/non-conformities/new`}>
              Registrar não conformidade
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {nonConformities.map((nc) => (
            <Link
              className="flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted/30"
              href={`/audits/${auditId}/action-plans/new?ncId=${nc.id}`}
              key={nc.id}
            >
              <span className="text-sm font-semibold">{nc.title}</span>
              <span className="text-xs text-muted-foreground">
                {nc.audit.company.name} — {nc.audit.title}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
