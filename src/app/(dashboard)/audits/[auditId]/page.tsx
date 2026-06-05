import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { hasRole, requireAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { AuditChecklistsPanel } from "@/features/audit-checklists/components/audit-checklists-panel";
import {
  getAuditChecklistExecution,
  listAvailableChecklistTemplates,
} from "@/features/audit-checklists/services/audit-checklist-service";
import { AuditDetailsCard } from "@/features/audits/components/audit-details-card";
import { getAuditByIdForOrganization } from "@/features/audits/services/audit-service";

type AuditPageProps = {
  params: Promise<{
    auditId: string;
  }>;
  searchParams?: Promise<{
    created?: string;
  }>;
};

const checklistExecutionRoles = ["ADMIN", "CONSULTANT"] as const;
const nonConformityEditorRoles = ["ADMIN", "CONSULTANT"] as const;

export default async function AuditPage({ params, searchParams }: AuditPageProps) {
  const user = await requireAuth();

  if (!user.organizationId) {
    redirect("/dashboard");
  }

  const { auditId } = await params;
  const [audit, appliedChecklists, availableTemplates] = await Promise.all([
    getAuditByIdForOrganization({
      auditId,
      organizationId: user.organizationId,
    }),
    getAuditChecklistExecution({
      auditId,
      organizationId: user.organizationId,
    }),
    listAvailableChecklistTemplates(user.organizationId),
  ]);

  if (!audit) {
    notFound();
  }

  const feedback = await searchParams;
  const canExecuteChecklists = hasRole(user, checklistExecutionRoles);
  const canCreateNonConformity = hasRole(user, nonConformityEditorRoles);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Auditorias
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {audit.title}
          </h1>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/audits">Voltar</Link>
          </Button>
          {canCreateNonConformity ? (
            <Button asChild>
              <Link href={`/audits/${audit.id}/non-conformities/new`}>
                Registrar NC
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {feedback?.created === "1" ? (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          Auditoria criada com sucesso.
        </p>
      ) : null}

      <AuditDetailsCard audit={audit} />

      <AuditChecklistsPanel
        appliedChecklists={appliedChecklists}
        auditId={audit.id}
        canExecute={canExecuteChecklists}
        templates={availableTemplates}
      />
    </section>
  );
}
