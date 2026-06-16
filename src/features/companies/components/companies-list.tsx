import { Building2, ClipboardCheck, Edit, Eye, MapPin } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import type { CompanyListItem } from "../services/company-service";
import { DeleteCompanyButton } from "./delete-company-button";

type CompaniesListProps = {
  canDelete: boolean;
  canManage: boolean;
  companies: CompanyListItem[];
};

export function CompaniesList({
  canDelete,
  canManage,
  companies,
}: CompaniesListProps) {
  return (
    <div className="grid gap-3">
      {companies.map((company) => (
        <article
          className="rounded-xl border bg-card/95 p-4 shadow-sm ring-1 ring-black/2 transition-all hover:border-[color:rgba(194,124,58,0.28)] hover:bg-card"
          key={company.id}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[color:rgba(194,124,58,0.12)] text-[color:var(--atlas-accent)]">
                <Building2 className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="truncate text-base font-semibold">
                    {company.name}
                  </h2>
                  {company.cnpj ? (
                    <span className="text-sm text-muted-foreground">
                      {company.cnpj}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-4" />
                  {[company.city, company.state].filter(Boolean).join(" / ") ||
                    company.address ||
                    "Localizacao nao informada"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border bg-background px-2.5 py-1">
                    {company.segment ?? "Sem segmento"}
                  </span>
                  <span className="rounded-full border bg-background px-2.5 py-1">
                    {company._count.audits} auditoria
                    {company._count.audits !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
              <Button asChild className="w-full sm:w-auto" size="sm" variant="outline">
                <Link href={`/companies/${company.id}`}>
                  <Eye className="size-4" />
                  Ver empresa
                </Link>
              </Button>
              {canManage ? (
                <>
                  <Button asChild className="w-full sm:w-auto" size="sm">
                    <Link href={`/audits/new?companyId=${company.id}`}>
                      <ClipboardCheck className="size-4" />
                      Gerar auditoria
                    </Link>
                  </Button>
                  <Button asChild className="w-full sm:w-auto" size="sm" variant="outline">
                    <Link href={`/companies/${company.id}/edit`}>
                      <Edit className="size-4" />
                      Editar
                    </Link>
                  </Button>
                </>
              ) : null}
              {canDelete ? (
                <DeleteCompanyButton
                  companyId={company.id}
                  companyName={company.name}
                  size="sm"
                />
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
