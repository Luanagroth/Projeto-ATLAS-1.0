import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { hasRole, requireAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { CompaniesEmptyState } from "@/features/companies/components/companies-empty-state";
import { CompaniesList } from "@/features/companies/components/companies-list";
import { listCompaniesByOrganization } from "@/features/companies/services/company-service";

const companyCreatorRoles = ["ADMIN", "CONSULTANT"] as const;

type CompaniesPageProps = {
  searchParams?: Promise<{
    deleted?: string;
  }>;
};

export default async function CompaniesPage({ searchParams }: CompaniesPageProps) {
  const user = await requireAuth();

  if (!user.organizationId) {
    redirect("/dashboard");
  }

  const [companies, canCreateCompany] = await Promise.all([
    listCompaniesByOrganization(user.organizationId),
    Promise.resolve(hasRole(user, companyCreatorRoles)),
  ]);
  const feedback = await searchParams;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Empresas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie as empresas clientes vinculadas à sua organização.
          </p>
        </div>
        {canCreateCompany ? (
          <Button asChild>
            <Link href="/companies/new">
              <Plus />
              Nova empresa
            </Link>
          </Button>
        ) : null}
      </div>

      {feedback?.deleted === "1" ? (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          Empresa excluída com sucesso.
        </p>
      ) : null}

      {companies.length > 0 ? (
        <CompaniesList companies={companies} />
      ) : (
        <CompaniesEmptyState canCreateCompany={canCreateCompany} />
      )}
    </section>
  );
}
