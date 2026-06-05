import { Building2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { hasRole, requireAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { AuditForm } from "@/features/audits/components/audit-form";
import { listAuditCompanyOptions } from "@/features/audits/services/audit-service";

const auditCreatorRoles = ["ADMIN", "CONSULTANT"] as const;

export default async function NewAuditPage() {
  const user = await requireAuth();

  if (!user.organizationId) {
    redirect("/dashboard");
  }

  if (!hasRole(user, auditCreatorRoles)) {
    redirect("/audits");
  }

  const companies = await listAuditCompanyOptions(user.organizationId);

  if (companies.length === 0) {
    return (
      <section className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Nova auditoria
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre uma empresa antes de iniciar uma auditoria.
          </p>
        </div>

        <div className="rounded-lg border border-dashed bg-card p-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-md bg-muted">
            <Building2 className="size-6 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">
            Nenhuma empresa cadastrada
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Auditorias precisam estar vinculadas a uma empresa real da sua
            organização.
          </p>
          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
            <Button asChild variant="outline">
              <Link href="/audits">Voltar</Link>
            </Button>
            <Button asChild>
              <Link href="/companies/new">Criar empresa</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Nova auditoria
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Crie uma auditoria vinculada a uma empresa da sua organização.
        </p>
      </div>
      <AuditForm companies={companies} />
    </section>
  );
}
