import { Building2, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type CompaniesEmptyStateProps = {
  canCreateCompany: boolean;
};

export function CompaniesEmptyState({
  canCreateCompany,
}: CompaniesEmptyStateProps) {
  return (
    <div className="rounded-lg border bg-card p-8 text-center shadow-sm">
      <div className="mx-auto flex size-12 items-center justify-center rounded-md bg-muted">
        <Building2 className="size-6 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">Nenhuma empresa cadastrada</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        As empresas clientes da sua organização vão aparecer aqui quando forem
        cadastradas.
      </p>
      {canCreateCompany ? (
        <Button asChild className="mt-6 w-full sm:w-auto">
          <Link href="/companies/new">
            <Plus />
            Nova empresa
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
