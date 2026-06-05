import { Building2, MapPin } from "lucide-react";
import Link from "next/link";

import type { CompanyListItem } from "../services/company-service";

type CompaniesListProps = {
  companies: CompanyListItem[];
};

export function CompaniesList({ companies }: CompaniesListProps) {
  return (
    <div className="grid gap-3">
      {companies.map((company) => (
        <Link
          key={company.id}
          href={`/companies/${company.id}`}
          className="group rounded-lg border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/30"
        >
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
              <Building2 className="size-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="truncate text-base font-semibold group-hover:text-primary">
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
                {company.address ?? "Endereço não informado"}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
