import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { hasRole, requireAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { CompanyDetailsCard } from "@/features/companies/components/company-details-card";
import { DeleteCompanyButton } from "@/features/companies/components/delete-company-button";
import { getCompanyByIdForOrganization } from "@/features/companies/services/company-service";

type CompanyPageProps = {
  params: Promise<{
    companyId: string;
  }>;
  searchParams?: Promise<{
    created?: string;
    updated?: string;
  }>;
};

const companyManagerRoles = ["ADMIN", "CONSULTANT"] as const;
const companyDeleteRoles = ["ADMIN"] as const;

export default async function CompanyPage({
  params,
  searchParams,
}: CompanyPageProps) {
  const user = await requireAuth();

  if (!user.organizationId) {
    redirect("/dashboard");
  }

  const { companyId } = await params;
  const company = await getCompanyByIdForOrganization({
    companyId,
    organizationId: user.organizationId,
  });

  if (!company) {
    notFound();
  }

  const canEditCompany = hasRole(user, companyManagerRoles);
  const canDeleteCompany = hasRole(user, companyDeleteRoles);
  const feedback = await searchParams;
  const successMessage =
    feedback?.created === "1"
      ? "Empresa criada com sucesso."
      : feedback?.updated === "1"
        ? "Empresa atualizada com sucesso."
        : null;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Empresas</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {company.name}
          </h1>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/companies">Voltar</Link>
          </Button>
          {canEditCompany ? (
            <>
              {canDeleteCompany ? (
                <DeleteCompanyButton
                  companyId={company.id}
                  companyName={company.name}
                />
              ) : null}
              <Button asChild>
                <Link href={`/companies/${company.id}/edit`}>
                  Editar empresa
                </Link>
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {successMessage ? (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </p>
      ) : null}

      <CompanyDetailsCard company={company} />
    </section>
  );
}
