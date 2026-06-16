import { notFound, redirect } from "next/navigation";

import { hasRole, requireAuth } from "@/auth";
import { CompanyForm } from "@/features/companies/components/company-form";
import {
  type CompanyDetails,
  getCompanyByIdForOrganization,
} from "@/features/companies/services/company-service";
import type { CompanyFormValues } from "@/features/companies/schemas/company-schema";
import {
  companyDocumentTypeOptions,
  companyLegalTypeOptions,
} from "@/features/companies/schemas/company-schema";

type EditCompanyPageProps = {
  params: Promise<{
    companyId: string;
  }>;
};

type ExtraField = {
  key: string;
  value: string;
};

const companyManagerRoles = ["ADMIN", "CONSULTANT"] as const;

function textValue(value?: string | null) {
  return value ?? "";
}

function documentTypeValue(value?: string | null): CompanyFormValues["documentType"] {
  return companyDocumentTypeOptions.includes(
    value as (typeof companyDocumentTypeOptions)[number],
  )
    ? (value as CompanyFormValues["documentType"])
    : "";
}

function legalTypeValue(value?: string | null): CompanyFormValues["legalType"] {
  return companyLegalTypeOptions.includes(
    value as (typeof companyLegalTypeOptions)[number],
  )
    ? (value as CompanyFormValues["legalType"])
    : "";
}

function parseExtraFields(value: unknown): ExtraField[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((field) => {
      if (!field || typeof field !== "object") {
        return null;
      }

      const record = field as Record<string, unknown>;
      const key = typeof record.key === "string" ? record.key : "";
      const fieldValue = typeof record.value === "string" ? record.value : "";

      return { key, value: fieldValue };
    })
    .filter((field): field is ExtraField => Boolean(field));
}

function toFormValues(company: CompanyDetails): CompanyFormValues {
  return {
    name: company.name,
    cnpj: textValue(company.cnpj),
    description: textValue(company.description),
    address: textValue(company.address),
    tradeName: textValue(company.tradeName),
    legalName: textValue(company.legalName),
    documentType: documentTypeValue(company.documentType),
    legalType: legalTypeValue(company.legalType),
    segment: textValue(company.segment),
    employeeCount: company.employeeCount ?? undefined,
    responsibleName: textValue(company.responsibleName),
    responsibleRole: textValue(company.responsibleRole),
    email: textValue(company.email),
    phone: textValue(company.phone),
    zipCode: textValue(company.zipCode),
    city: textValue(company.city),
    state: textValue(company.state),
    country: textValue(company.country) || "Brasil",
    notes: textValue(company.notes),
    extraFields: parseExtraFields(company.extraFields),
  };
}

export default async function EditCompanyPage({ params }: EditCompanyPageProps) {
  const user = await requireAuth();

  if (!user.organizationId) {
    redirect("/dashboard");
  }

  if (!hasRole(user, companyManagerRoles)) {
    redirect("/companies");
  }

  const { companyId } = await params;
  const company = await getCompanyByIdForOrganization({
    companyId,
    organizationId: user.organizationId,
  });

  if (!company) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Editar empresa
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Atualize os dados cadastrais, operacionais e de conformidade.
        </p>
      </div>
      <CompanyForm
        cancelHref={`/companies/${company.id}`}
        companyId={company.id}
        initialValues={toFormValues(company)}
        mode="edit"
      />
    </section>
  );
}
