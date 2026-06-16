import { redirect } from "next/navigation";

import { hasRole, requireAuth } from "@/auth";
import { CompanyForm } from "@/features/companies/components/company-form";

const companyCreatorRoles = ["ADMIN", "CONSULTANT"] as const;

export default async function NewCompanyPage() {
  const user = await requireAuth();

  if (!user.organizationId || !hasRole(user, companyCreatorRoles)) {
    redirect("/companies");
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nova empresa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cadastre uma empresa cliente para organizar auditorias futuras.
        </p>
      </div>
      <CompanyForm cancelHref="/companies" mode="create" />
    </section>
  );
}
