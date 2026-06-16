import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { hasRole, requireAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { AuditsEmptyState } from "@/features/audits/components/audits-empty-state";
import { AuditsList } from "@/features/audits/components/audits-list";
import { listAuditsByOrganizationWithFilters } from "@/features/audits/services/audit-service";

type AuditsPageProps = {
  searchParams?: Promise<{
    created?: string;
    q?: string;
  }>;
};

const auditCreatorRoles = ["ADMIN", "CONSULTANT"] as const;

function isActiveAudit(status: string) {
  return status === "DRAFT" || status === "IN_PROGRESS";
}

export default async function AuditsPage({ searchParams }: AuditsPageProps) {
  const user = await requireAuth();
  const feedback = await searchParams;

  if (!user.organizationId) {
    redirect("/dashboard");
  }

  const [audits, canCreateAudit] = await Promise.all([
    listAuditsByOrganizationWithFilters(user.organizationId, {
      q: feedback?.q,
    }),
    Promise.resolve(hasRole(user, auditCreatorRoles)),
  ]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Auditorias</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe auditorias vinculadas às empresas da sua organização.
          </p>
        </div>
        {canCreateAudit ? (
          <Button asChild className="w-full sm:w-auto">
            <Link href="/audits/new">
              <Plus />
              Nova auditoria
            </Link>
          </Button>
        ) : null}
      </div>

      {feedback?.created === "1" ? (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          Auditoria criada com sucesso.
        </p>
      ) : null}

      <form className="rounded-lg border bg-card p-4 shadow-sm" action="/audits">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1.5fr)_auto]">
          <input
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            defaultValue={feedback?.q ?? ""}
            name="q"
            placeholder="Pesquisar por empresa ou CNPJ"
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="w-full sm:w-auto" type="submit">
              Filtrar
            </Button>
            <Button asChild className="w-full sm:w-auto" type="button" variant="outline">
              <Link href="/audits">Limpar</Link>
            </Button>
          </div>
        </div>
      </form>

      {audits.length > 0 ? (
        <div className="space-y-6">
          {audits.filter((audit) => isActiveAudit(audit.status)).length > 0 ? (
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">Auditorias ativas</h2>
                  <p className="text-sm text-muted-foreground">
                    Fluxo em andamento. Se houver muitas, esta lista ganha rolagem.
                  </p>
                </div>
                <span className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                  {audits.filter((audit) => isActiveAudit(audit.status)).length}{" "}
                  ativas
                </span>
              </div>
              <div className="max-h-[36rem] overflow-y-auto pr-1">
                <AuditsList
                  audits={audits.filter((audit) => isActiveAudit(audit.status))}
                />
              </div>
            </section>
          ) : null}

          {audits.filter((audit) => !isActiveAudit(audit.status)).length > 0 ? (
            <details className="rounded-lg border bg-card p-4 shadow-sm">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold">Historico de auditorias</h2>
                    <p className="text-sm text-muted-foreground">
                      Auditorias finalizadas para consulta interna e controle.
                    </p>
                  </div>
                  <span className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                    {audits.filter((audit) => !isActiveAudit(audit.status)).length}{" "}
                    finalizadas
                  </span>
                </div>
              </summary>
              <div className="mt-4">
                <AuditsList
                  audits={audits.filter((audit) => !isActiveAudit(audit.status))}
                />
              </div>
            </details>
          ) : null}
        </div>
      ) : (
        <AuditsEmptyState canCreateAudit={canCreateAudit} />
      )}
    </section>
  );
}
