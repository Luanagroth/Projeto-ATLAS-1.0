import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import type { CompanyFormValues } from "../schemas/company-schema";

function optionalText(value?: string | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function optionalNumber(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeExtraFields(values?: CompanyFormValues["extraFields"]) {
  const fields = (values ?? [])
    .map((field) => ({
      key: field.key.trim(),
      value: field.value.trim(),
    }))
    .filter((field) => field.key || field.value);

  return fields.length > 0 ? fields : Prisma.JsonNull;
}

function toCompanyData(values: CompanyFormValues) {
  return {
    name: values.name.trim(),
    cnpj: optionalText(values.cnpj),
    description: optionalText(values.description),
    address: optionalText(values.address),
    tradeName: optionalText(values.tradeName),
    legalName: optionalText(values.legalName),
    documentType: optionalText(values.documentType),
    legalType: optionalText(values.legalType),
    segment: optionalText(values.segment),
    employeeCount: optionalNumber(values.employeeCount),
    responsibleName: optionalText(values.responsibleName),
    responsibleRole: optionalText(values.responsibleRole),
    email: optionalText(values.email),
    phone: optionalText(values.phone),
    zipCode: optionalText(values.zipCode),
    city: optionalText(values.city),
    state: optionalText(values.state),
    country: optionalText(values.country) ?? "Brasil",
    notes: optionalText(values.notes),
    extraFields: normalizeExtraFields(values.extraFields),
  };
}

export type CompanyListItem = Awaited<
  ReturnType<typeof listCompaniesByOrganization>
>[number];

export type CompanyDetails = NonNullable<
  Awaited<ReturnType<typeof getCompanyByIdForOrganization>>
>;

export async function listCompaniesByOrganization(organizationId: string) {
  return prisma.company.findMany({
    where: {
      organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      tradeName: true,
      cnpj: true,
      segment: true,
      address: true,
      city: true,
      state: true,
      createdAt: true,
    },
  });
}

export async function getCompanyByIdForOrganization({
  companyId,
  organizationId,
}: {
  companyId: string;
  organizationId: string;
}) {
  return prisma.company.findFirst({
    where: {
      id: companyId,
      organizationId,
    },
    select: {
      id: true,
      name: true,
      cnpj: true,
      description: true,
      address: true,
      tradeName: true,
      legalName: true,
      documentType: true,
      legalType: true,
      segment: true,
      employeeCount: true,
      responsibleName: true,
      responsibleRole: true,
      email: true,
      phone: true,
      zipCode: true,
      city: true,
      state: true,
      country: true,
      notes: true,
      extraFields: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function findCompanyDuplicate({
  organizationId,
  values,
  ignoreCompanyId,
}: {
  organizationId: string;
  values: CompanyFormValues;
  ignoreCompanyId?: string;
}) {
  const cnpj = optionalText(values.cnpj);
  const name = values.name.trim();

  const existing = await prisma.company.findFirst({
    where: {
      organizationId,
      ...(ignoreCompanyId ? { id: { not: ignoreCompanyId } } : {}),
      ...(cnpj
        ? { cnpj }
        : {
            cnpj: null,
            name: {
              equals: name,
              mode: "insensitive",
            },
          }),
    },
    select: {
      id: true,
      name: true,
      cnpj: true,
    },
  });

  if (!existing) {
    return null;
  }

  return cnpj ? "cnpj" : "name";
}

export async function createCompanyForOrganization({
  organizationId,
  values,
}: {
  organizationId: string;
  values: CompanyFormValues;
}) {
  return prisma.company.create({
    data: {
      organizationId,
      ...toCompanyData(values),
    },
    select: {
      id: true,
    },
  });
}

export async function updateCompanyForOrganization({
  companyId,
  organizationId,
  values,
}: {
  companyId: string;
  organizationId: string;
  values: CompanyFormValues;
}) {
  const result = await prisma.company.updateMany({
    where: {
      id: companyId,
      organizationId,
    },
    data: toCompanyData(values),
  });

  return result.count > 0;
}

export async function countCompanyAuditsForOrganization({
  companyId,
  organizationId,
}: {
  companyId: string;
  organizationId: string;
}) {
  return prisma.audit.count({
    where: {
      companyId,
      organizationId,
    },
  });
}

export async function deleteCompanyForOrganization({
  companyId,
  organizationId,
}: {
  companyId: string;
  organizationId: string;
}) {
  const result = await prisma.company.deleteMany({
    where: {
      id: companyId,
      organizationId,
    },
  });

  return result.count > 0;
}

export function isUniqueCompanyConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export function isRelationConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  );
}
