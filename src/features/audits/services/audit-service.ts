import "server-only";

import { prisma } from "@/lib/prisma";

import type { AuditFormValues } from "../schemas/audit-schema";

function optionalText(value?: string | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function optionalDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

export type AuditListItem = Awaited<
  ReturnType<typeof listAuditsByOrganization>
>[number];

export type AuditDetails = NonNullable<
  Awaited<ReturnType<typeof getAuditByIdForOrganization>>
>;

export type AuditCompanyOption = Awaited<
  ReturnType<typeof listAuditCompanyOptions>
>[number];

export async function listAuditsByOrganization(organizationId: string) {
  return prisma.audit.findMany({
    where: {
      organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export async function getAuditByIdForOrganization({
  auditId,
  organizationId,
}: {
  auditId: string;
  organizationId: string;
}) {
  return prisma.audit.findFirst({
    where: {
      id: auditId,
      organizationId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      startDate: true,
      endDate: true,
      dueDate: true,
      createdAt: true,
      updatedAt: true,
      company: {
        select: {
          id: true,
          name: true,
          cnpj: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function listAuditCompanyOptions(organizationId: string) {
  return prisma.company.findMany({
    where: {
      organizationId,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      cnpj: true,
    },
  });
}

export async function companyBelongsToOrganization({
  companyId,
  organizationId,
}: {
  companyId: string;
  organizationId: string;
}) {
  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      organizationId,
    },
    select: {
      id: true,
    },
  });

  return Boolean(company);
}

export async function createAuditForOrganization({
  createdById,
  organizationId,
  values,
}: {
  createdById: string;
  organizationId: string;
  values: AuditFormValues;
}) {
  return prisma.audit.create({
    data: {
      organizationId,
      companyId: values.companyId,
      createdById,
      title: values.title.trim(),
      status: values.status,
      description: optionalText(values.description),
      startDate: optionalDate(values.startDate),
      dueDate: optionalDate(values.dueDate),
    },
    select: {
      id: true,
    },
  });
}
