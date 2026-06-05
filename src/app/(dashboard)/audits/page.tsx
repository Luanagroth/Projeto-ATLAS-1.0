import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { hasRole, requireAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { AuditsEmptyState } from "@/features/audits/components/audits-empty-state";
import { AuditsList } from "@/features/audits/components/audits-list";
import { listAuditsByOrganization } from "@/features/audits/services/audit-service";

type AuditsPageProps = {
  searchParams?: Promise<{
    created?: string;
  }>;
};

const auditCreatorRoles = ["ADMIN", "CONSULTANT"] as const;

export default async function AuditsPage({ searchParams }: AuditsPageProps) {
  const user = await requireAuth();

  if (!user.organizationId) {
    redirect("/dashboard");
  }

  const [audits, canCreateAudit, feedback] = await Promise.all([
    listAuditsByOrganization(user.organizationId),
    Promise.resolve(hasRole(user, auditCreatorRoles)),
    searchParams,
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
          <Button asChild>
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

      {audits.length > 0 ? (
        <AuditsList audits={audits} />
      ) : (
        <AuditsEmptyState canCreateAudit={canCreateAudit} />
      )}
    </section>
  );
}
