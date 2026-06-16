import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import type { AuditStatusValue } from "@/features/audits/schemas/audit-schema";
import type { CompanyFormValues } from "../schemas/company-schema";

type CompanyFilters = {
  city?: string;
  q?: string;
  segment?: string;
  state?: string;
  status?: string;
};

type CompanyAuditStatusFilter = "NO_AUDITS" | "IN_PROGRESS" | "COMPLETED";

function optionalText(value?: string | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function optionalNumber(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeAuditStatusFilter(value?: string | null): CompanyAuditStatusFilter | null {
  if (value === "NO_AUDITS" || value === "IN_PROGRESS" || value === "COMPLETED") {
    return value;
  }

  return null;
}

function isNonEmptyString(value: string | null): value is string {
  return Boolean(value?.trim());
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

export type CompanyAuditItem = Awaited<
  ReturnType<typeof listCompanyAudits>
>[number];

export type CompanyEvidenceItem = Awaited<
  ReturnType<typeof listCompanyEvidences>
>[number];

export type CompanyHistoryItem = Awaited<
  ReturnType<typeof listCompanyHistory>
>[number];

export async function listCompaniesByOrganization(organizationId: string) {
  return listCompaniesByOrganizationWithFilters(organizationId);
}

export async function listCompaniesByOrganizationWithFilters(
  organizationId: string,
  filters: CompanyFilters = {},
) {
  const q = optionalText(filters.q);
  const status = normalizeAuditStatusFilter(filters.status);

  return prisma.company.findMany({
    where: {
      organizationId,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { tradeName: { contains: q, mode: "insensitive" } },
              { legalName: { contains: q, mode: "insensitive" } },
              { cnpj: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(filters.city ? { city: filters.city } : {}),
      ...(filters.state ? { state: filters.state } : {}),
      ...(filters.segment ? { segment: filters.segment } : {}),
      ...(status === "IN_PROGRESS"
        ? {
            audits: {
              some: {
                status: { in: ["DRAFT", "IN_PROGRESS"] as AuditStatusValue[] },
              },
            },
          }
        : {}),
      ...(status === "COMPLETED"
        ? {
            audits: {
              some: {
                status: { in: ["COMPLETED", "CANCELLED"] as AuditStatusValue[] },
              },
            },
          }
        : {}),
      ...(status === "NO_AUDITS" ? { audits: { none: {} } } : {}),
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
      _count: {
        select: {
          audits: true,
        },
      },
    },
  });
}

export async function getCompanyFilterOptions(organizationId: string) {
  const [cities, states, segments] = await Promise.all([
    prisma.company.findMany({
      distinct: ["city"],
      where: { organizationId, city: { not: null } },
      orderBy: { city: "asc" },
      select: { city: true },
    }),
    prisma.company.findMany({
      distinct: ["state"],
      where: { organizationId, state: { not: null } },
      orderBy: { state: "asc" },
      select: { state: true },
    }),
    prisma.company.findMany({
      distinct: ["segment"],
      where: { organizationId, segment: { not: null } },
      orderBy: { segment: "asc" },
      select: { segment: true },
    }),
  ]);

  return {
    cities: cities.map((item) => item.city).filter(isNonEmptyString),
    states: states.map((item) => item.state).filter(isNonEmptyString),
    segments: segments.map((item) => item.segment).filter(isNonEmptyString),
  };
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

export async function listCompanyAudits({
  companyId,
  organizationId,
}: {
  companyId: string;
  organizationId: string;
}) {
  return prisma.audit.findMany({
    where: {
      companyId,
      organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      status: true,
      startDate: true,
      dueDate: true,
      createdAt: true,
      _count: {
        select: {
          nonConformities: true,
          appliedChecklists: true,
        },
      },
    },
  });
}

export async function listCompanyEvidences({
  companyId,
  organizationId,
}: {
  companyId: string;
  organizationId: string;
}) {
  return prisma.evidence.findMany({
    where: {
      audit: {
        companyId,
        organizationId,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
    select: {
      id: true,
      title: true,
      fileUrl: true,
      origin: true,
      status: true,
      createdAt: true,
      actionPlan: {
        select: {
          id: true,
          title: true,
        },
      },
      audit: {
        select: {
          id: true,
          title: true,
        },
      },
      attachedBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function listCompanyHistory({
  companyId,
  organizationId,
}: {
  companyId: string;
  organizationId: string;
}) {
  return prisma.auditLog.findMany({
    where: {
      organizationId,
      audit: {
        companyId,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 30,
    select: {
      id: true,
      action: true,
      entity: true,
      changes: true,
      createdAt: true,
      audit: {
        select: {
          id: true,
          title: true,
        },
      },
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
