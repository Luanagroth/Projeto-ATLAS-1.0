import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import type {
  ChecklistResponseValues,
  SaveChecklistResponsesValues,
} from "../schemas/audit-checklist-schema";

function optionalText(value?: string | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function parseNumber(value?: string) {
  if (!value) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function parseDate(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function responseData(response: ChecklistResponseValues) {
  const answerValue = response.answerValue?.trim();

  return {
    answerBoolean:
      response.isCompliant === "true"
        ? true
        : response.isCompliant === "false"
          ? false
          : null,
    answerText: response.type === "TEXTO" ? optionalText(answerValue) : null,
    answerNumber:
      response.type === "NUMERO" ? parseNumber(answerValue) : null,
    answerDate: response.type === "DATA" ? parseDate(answerValue) : null,
    answerChoice:
      response.type === "SIM_NAO" || response.type === "MULTIPLA_ESCOLHA"
        ? optionalText(answerValue)
        : null,
    notes: optionalText(response.notes),
    evidence: optionalText(response.evidence),
  };
}

function jsonInput(value: unknown) {
  return value === null ? Prisma.JsonNull : value;
}

export type AvailableChecklistTemplate = Awaited<
  ReturnType<typeof listAvailableChecklistTemplates>
>[number];

export type AuditChecklistExecution = Awaited<
  ReturnType<typeof getAuditChecklistExecution>
>;

export async function listAvailableChecklistTemplates(organizationId: string) {
  return prisma.checklist.findMany({
    where: {
      organizationId,
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      category: true,
      _count: {
        select: {
          items: true,
        },
      },
    },
  });
}

export async function getAuditChecklistExecution({
  auditId,
  organizationId,
}: {
  auditId: string;
  organizationId: string;
}) {
  return prisma.auditChecklist.findMany({
    where: {
      auditId,
      audit: {
        organizationId,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      checklistName: true,
      checklistCategory: true,
      status: true,
      auditorNote: true,
      auditorNoteVisibility: true,
      items: {
        orderBy: {
          order: "asc",
        },
        select: {
          id: true,
          question: true,
          description: true,
          type: true,
          options: true,
          order: true,
          isRequired: true,
          responses: {
            where: {
              auditId,
            },
            take: 1,
            select: {
              id: true,
              answerBoolean: true,
              answerText: true,
              answerNumber: true,
              answerDate: true,
              answerChoice: true,
              notes: true,
              evidence: true,
              updatedAt: true,
              respondent: {
                select: {
                  name: true,
                  email: true,
                },
              },
              updatedBy: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          nonConformities: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      },
    },
  });
}

export async function applyChecklistTemplateToAudit({
  auditId,
  checklistId,
  organizationId,
}: {
  auditId: string;
  checklistId: string;
  organizationId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const audit = await tx.audit.findFirst({
      where: {
        id: auditId,
        organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!audit) {
      return { error: "Auditoria não encontrada." as const };
    }

    const template = await tx.checklist.findFirst({
      where: {
        id: checklistId,
        organizationId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        version: true,
        items: {
          orderBy: {
            order: "asc",
          },
          select: {
            id: true,
            question: true,
            description: true,
            type: true,
            options: true,
            order: true,
            isRequired: true,
          },
        },
      },
    });

    if (!template) {
      return { error: "Modelo de checklist não encontrado." as const };
    }

    if (template.items.length === 0) {
      return { error: "Este modelo não possui itens." as const };
    }

    const applied = await tx.auditChecklist.create({
      data: {
        auditId,
        checklistId: template.id,
        checklistName: template.name,
        checklistDescription: template.description,
        checklistCategory: template.category,
        checklistVersion: template.version,
        auditorNote: null,
        auditorNoteVisibility: "INTERNAL",
        items: {
          create: template.items.map((item) => ({
            sourceItemId: item.id,
            question: item.question,
            description: item.description,
            type: item.type,
            options: jsonInput(item.options),
            order: item.order,
            isRequired: item.isRequired,
          })),
        },
      },
      select: {
        id: true,
      },
    });

    return { id: applied.id };
  });
}

export async function saveChecklistResponses({
  organizationId,
  respondentId,
  updatedById,
  values,
}: {
  organizationId: string;
  respondentId: string;
  updatedById: string;
  values: SaveChecklistResponsesValues;
}) {
  const auditChecklist = await prisma.auditChecklist.findFirst({
    where: {
      id: values.auditChecklistId,
      auditId: values.auditId,
      audit: {
        organizationId,
      },
    },
    select: {
      id: true,
      items: {
        select: {
          id: true,
          type: true,
        },
      },
    },
  });

  if (!auditChecklist) {
    return { error: "Checklist aplicado não encontrado." as const };
  }

  const itemTypes = new Map(
    auditChecklist.items.map((item) => [item.id, item.type]),
  );

  await prisma.$transaction(
    [
      ...values.responses.map((response) => {
      const expectedType = itemTypes.get(response.auditChecklistItemId);

      if (!expectedType) {
        throw new Error("Invalid checklist item.");
      }

      const normalizedResponse = {
        ...response,
        type: expectedType,
      };

      return prisma.checklistResponse.upsert({
        where: {
          auditId_auditChecklistItemId: {
            auditId: values.auditId,
            auditChecklistItemId: response.auditChecklistItemId,
          },
        },
        create: {
          auditId: values.auditId,
          auditChecklistItemId: response.auditChecklistItemId,
          respondentId,
          updatedById,
          ...responseData(normalizedResponse),
        },
        update: {
          updatedById,
          ...responseData(normalizedResponse),
        },
      });
      }),
      prisma.audit.updateMany({
        where: {
          id: values.auditId,
          organizationId,
          status: "DRAFT",
        },
        data: {
          status: "IN_PROGRESS",
          startDate: new Date(),
        },
      }),
      prisma.auditLog.create({
        data: {
          organizationId,
          auditId: values.auditId,
          action: "CHECKLIST_RESPONSES_SAVED",
          entity: "AUDIT_CHECKLIST",
          changes: JSON.stringify({
            responses: values.responses.length,
            auditorNoteVisibility: values.auditorNoteVisibility,
          }),
        },
      }),
    ],
  );

  await prisma.auditChecklist.update({
    where: {
      id: values.auditChecklistId,
    },
    data: {
      status: "IN_PROGRESS",
      auditorNote: optionalText(values.auditorNote),
      auditorNoteVisibility: values.auditorNoteVisibility,
    },
  });

  const possibleIrregularities = await prisma.checklistResponse.count({
    where: {
      auditId: values.auditId,
      answerBoolean: false,
      auditChecklistItem: {
        nonConformities: { none: {} },
        nonConformityLinks: { none: {} },
      },
    },
  });

  return { ok: true, possibleIrregularities };
}
