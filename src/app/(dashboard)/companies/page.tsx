import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { assertSectionAccess, hasRole, requireAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { CompaniesEmptyState } from "@/features/companies/components/companies-empty-state";
import { CompaniesList } from "@/features/companies/components/companies-list";
import {
  getCompanyFilterOptions,
  listCompaniesByOrganizationWithFilters,
} from "@/features/companies/services/company-service";

const companyCreatorRoles = ["ADMIN", "CONSULTANT"] as const;
const companyDeleteRoles = ["ADMIN"] as const;

const companyAuditStatusFilters = [
  { label: "Sem auditorias", value: "NO_AUDITS" },
  { label: "Em andamento", value: "IN_PROGRESS" },
  { label: "Finalizada", value: "COMPLETED" },
] as const;

type CompaniesPageProps = {
  searchParams?: Promise<{
    city?: string;
    deleted?: string;
    q?: string;
    segment?: string;
    state?: string;
    status?: string;
  }>;
};

export default async function CompaniesPage({ searchParams }: CompaniesPageProps) {
  const user = await requireAuth();
  assertSectionAccess(user, "companies");

  if (!user.organizationId) {
    redirect("/");
  }

  const filters = await searchParams;
  const [companies, filterOptions, canCreateCompany, canDeleteCompany] =
    await Promise.all([
      listCompaniesByOrganizationWithFilters(user.organizationId, filters),
      getCompanyFilterOptions(user.organizationId),
      Promise.resolve(hasRole(user, companyCreatorRoles)),
      Promise.resolve(hasRole(user, companyDeleteRoles)),
    ]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Empresas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use a empresa como dossie central para auditorias, historico e
            evidencias.
          </p>
        </div>
        {canCreateCompany ? (
          <Button asChild className="w-full sm:w-auto">
            <Link href="/companies/new">
              <Plus />
              Nova empresa
            </Link>
          </Button>
        ) : null}
      </div>

      {filters?.deleted === "1" ? (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          Empresa excluida com sucesso.
        </p>
      ) : null}

      <form className="rounded-lg border bg-card p-4 shadow-sm" action="/companies">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))_auto]">
          <input
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            defaultValue={filters?.q ?? ""}
            name="q"
            placeholder="Buscar por nome ou CNPJ"
          />
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            defaultValue={filters?.status ?? ""}
            name="status"
          >
            <option value="">Status da auditoria</option>
            {companyAuditStatusFilters.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            defaultValue={filters?.city ?? ""}
            name="city"
          >
            <option value="">Cidade</option>
            {filterOptions.cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            defaultValue={filters?.state ?? ""}
            name="state"
          >
            <option value="">UF</option>
            {filterOptions.states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            defaultValue={filters?.segment ?? ""}
            name="segment"
          >
            <option value="">Segmento</option>
            {filterOptions.segments.map((segment) => (
              <option key={segment} value={segment}>
                {segment}
              </option>
            ))}
          </select>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="w-full sm:w-auto" type="submit">
              Filtrar
            </Button>
            <Button asChild className="w-full sm:w-auto" type="button" variant="outline">
              <Link href="/companies">Limpar</Link>
            </Button>
          </div>
        </div>
      </form>

      {companies.length > 0 ? (
        <CompaniesList
          canDelete={canDeleteCompany}
          canManage={canCreateCompany}
          companies={companies}
        />
      ) : (
        <CompaniesEmptyState canCreateCompany={canCreateCompany} />
      )}
    </section>
  );
}
