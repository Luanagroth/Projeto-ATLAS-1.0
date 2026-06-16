import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import {
  ActionPlanStatus,
  AuditChecklistStatus,
  AuditDocumentOrigin,
  AuditOpinionStatus,
  AuditStatus,
  AuditorNoteVisibility,
  ChecklistItemType,
  EvidenceOrigin,
  EvidenceStatus,
  NonConformityStatus,
  NotificationType,
  PrismaClient,
  Role,
  Severity,
} from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth-utils";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run the seed.");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

const dates = {
  may20: new Date("2026-05-20T09:00:00.000Z"),
  may28: new Date("2026-05-28T14:30:00.000Z"),
  jun01: new Date("2026-06-01T08:30:00.000Z"),
  jun03: new Date("2026-06-03T10:15:00.000Z"),
  jun05: new Date("2026-06-05T15:20:00.000Z"),
  jun07: new Date("2026-06-07T11:00:00.000Z"),
  jun10: new Date("2026-06-10T16:45:00.000Z"),
  jun12: new Date("2026-06-12T09:40:00.000Z"),
  jun13: new Date("2026-06-13T13:10:00.000Z"),
  jun14: new Date("2026-06-14T08:10:00.000Z"),
  jun15: new Date("2026-06-15T17:00:00.000Z"),
  jun18: new Date("2026-06-18T12:00:00.000Z"),
  jun20: new Date("2026-06-20T18:00:00.000Z"),
  jun22: new Date("2026-06-22T10:00:00.000Z"),
  jun25: new Date("2026-06-25T18:00:00.000Z"),
  jun28: new Date("2026-06-28T16:00:00.000Z"),
};

async function resetDatabase() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "AuditDocument",
      "Evidence",
      "ActionPlanHistory",
      "ActionPlanNonConformity",
      "ActionPlan",
      "NonConformityChecklistItem",
      "NonConformity",
      "ChecklistResponse",
      "AuditChecklistItem",
      "AuditChecklist",
      "AuditOpinionHistory",
      "AuditOpinion",
      "AuditLog",
      "Notification",
      "Audit",
      "ChecklistItem",
      "Checklist",
      "Company",
      "OrganizationMembership",
      "Organization",
      "User"
    RESTART IDENTITY CASCADE
  `);
}

async function createUser({
  email,
  name,
  password,
  phone,
}: {
  email: string;
  name: string;
  password: string;
  phone?: string;
}) {
  const passwordHash = await hashPassword(password);

  return prisma.user.create({
    data: {
      email,
      name,
      password: passwordHash,
      phone,
    },
  });
}

async function main() {
  await resetDatabase();

  const organization = await prisma.organization.create({
    data: {
      name: "Solutions Auditoria e Conformidade",
      slug: "solutions-auditoria-conformidade",
      description:
        "Consultoria especializada em auditorias internas, conformidade operacional e planos de ação corretiva.",
      cnpj: "12.345.678/0001-90",
      email: "contato@solutions.local",
      phone: "(11) 4002-1010",
      address: "Avenida Paulista, 1450, Bela Vista, São Paulo - SP",
    },
  });

  const [
    masterAdmin,
    mariaEduarda,
    klemberSilva,
    clientPaoDaVida,
    clientPetVita,
    clientClinicaFenix,
  ] = await Promise.all([
    createUser({
      email: "suportegrothsul@gmail.com",
      name: "Administrador Master Groth Sul",
      password: "Groth@123",
      phone: "(47) 99911-2200",
    }),
    createUser({
      email: "maria.eduarda@solutions.local",
      name: "Maria Eduarda Nogueira",
      password: "Maria@123",
      phone: "(11) 99871-4455",
    }),
    createUser({
      email: "klember.silva@solutions.local",
      name: "Klember Silva Rocha",
      password: "Klember@123",
      phone: "(11) 99741-0088",
    }),
    createUser({
      email: "qualidade@paodavida.local",
      name: "Joana Ribeiro",
      password: "Cliente@123",
      phone: "(11) 99120-3001",
    }),
    createUser({
      email: "operacoes@petvita.local",
      name: "Lucas Ferraz",
      password: "Cliente@123",
      phone: "(11) 99255-4412",
    }),
    createUser({
      email: "compliance@clinicafenix.local",
      name: "Renata Sampaio",
      password: "Cliente@123",
      phone: "(11) 99088-7344",
    }),
  ]);

  await prisma.organizationMembership.createMany({
    data: [
      {
        organizationId: organization.id,
        role: Role.ADMIN,
        userId: masterAdmin.id,
      },
      {
        organizationId: organization.id,
        role: Role.ADMIN,
        userId: mariaEduarda.id,
      },
      {
        organizationId: organization.id,
        role: Role.CONSULTANT,
        userId: klemberSilva.id,
      },
      {
        organizationId: organization.id,
        role: Role.CLIENT,
        userId: clientPaoDaVida.id,
      },
      {
        organizationId: organization.id,
        role: Role.CLIENT,
        userId: clientPetVita.id,
      },
      {
        organizationId: organization.id,
        role: Role.CLIENT,
        userId: clientClinicaFenix.id,
      },
    ],
  });

  const [paoDaVida, petVita, clinicaFenix] = await Promise.all([
    prisma.company.create({
      data: {
        organizationId: organization.id,
        name: "Pão da Vida Alimentos Ltda.",
        cnpj: "18.221.430/0001-52",
        tradeName: "Pão da Vida",
        legalName: "Pão da Vida Alimentos Ltda.",
        segment: "Indústria alimentícia",
        legalType: "Sociedade limitada",
        documentType: "CNPJ",
        responsibleName: "Helena Martins",
        responsibleRole: "Gerente de Qualidade",
        email: "qualidade@paodavida.com",
        phone: "(11) 3232-1100",
        zipCode: "01310-100",
        address: "Rua das Palmeiras, 240",
        city: "São Paulo",
        state: "SP",
        description:
          "Fábrica de panificados congelados com operação de produção, embalagem e distribuição regional.",
        employeeCount: 86,
        notes:
          "Cliente com histórico de auditorias trimestrais e foco em boas práticas de fabricação.",
      },
    }),
    prisma.company.create({
      data: {
        organizationId: organization.id,
        name: "PetVita Distribuidora Veterinária Ltda.",
        cnpj: "27.553.910/0001-08",
        tradeName: "PetVita",
        legalName: "PetVita Distribuidora Veterinária Ltda.",
        segment: "Distribuição e logística",
        legalType: "Sociedade limitada",
        documentType: "CNPJ",
        responsibleName: "Lucas Ferraz",
        responsibleRole: "Supervisor de Operações",
        email: "operacoes@petvita.com",
        phone: "(11) 4111-7800",
        zipCode: "07250-320",
        address: "Avenida Industrial, 890",
        city: "Guarulhos",
        state: "SP",
        description:
          "Centro de distribuição com foco em rastreabilidade, armazenamento e expedição de insumos veterinários.",
        employeeCount: 54,
        notes:
          "Operação com atenção especial para lote, validade e comprovação de despacho.",
      },
    }),
    prisma.company.create({
      data: {
        organizationId: organization.id,
        name: "Clínica Fênix Diagnósticos Integrados Ltda.",
        cnpj: "33.819.240/0001-61",
        tradeName: "Clínica Fênix",
        legalName: "Clínica Fênix Diagnósticos Integrados Ltda.",
        segment: "Serviços de saúde",
        legalType: "Sociedade limitada",
        documentType: "CNPJ",
        responsibleName: "Renata Sampaio",
        responsibleRole: "Coordenadora Administrativa",
        email: "compliance@clinicafenix.com",
        phone: "(11) 3030-5500",
        zipCode: "05422-020",
        address: "Rua Harmonia, 515",
        city: "São Paulo",
        state: "SP",
        description:
          "Clínica de diagnósticos com fase preparatória de revisão documental e governança interna.",
        employeeCount: 39,
        notes:
          "Cliente novo, ainda em pré-auditoria de maturidade documental.",
      },
    }),
  ]);

  const [checklistFood, checklistLogistics] = await Promise.all([
    prisma.checklist.create({
      data: {
        organizationId: organization.id,
        name: "Boas Práticas Operacionais - Alimentos",
        description:
          "Checklist para avaliar higiene, rastreabilidade e controles operacionais em indústrias alimentícias.",
        category: "Boas práticas",
        version: 2,
        isActive: true,
        items: {
          create: [
            {
              question: "Os manipuladores utilizam uniforme completo e limpo durante a operação?",
              description: "Verificar touca, avental, calçado e conservação geral.",
              type: ChecklistItemType.SIM_NAO,
              order: 1,
            },
            {
              question: "Existe registro atualizado de controle de temperatura da produção?",
              description: "Confirmar medições, horários e assinatura do responsável.",
              type: ChecklistItemType.SIM_NAO,
              order: 2,
            },
            {
              question: "Os lotes produzidos possuem rastreabilidade de origem e destino?",
              description: "Avaliar planilhas, etiquetas e histórico do lote.",
              type: ChecklistItemType.SIM_NAO,
              order: 3,
            },
            {
              question: "Informe a condição geral observada no setor auditado.",
              type: ChecklistItemType.TEXTO,
              order: 4,
            },
          ],
        },
      },
    }),
    prisma.checklist.create({
      data: {
        organizationId: organization.id,
        name: "Rastreabilidade e Estoque - Logística",
        description:
          "Checklist para expedição, armazenamento, validade e comprovação de movimentação de estoque.",
        category: "Rastreabilidade",
        version: 1,
        isActive: true,
        items: {
          create: [
            {
              question: "Os produtos expedidos possuem lote e validade identificados no romaneio?",
              type: ChecklistItemType.SIM_NAO,
              order: 1,
            },
            {
              question: "A conferência de estoque físico está compatível com o sistema?",
              type: ChecklistItemType.SIM_NAO,
              order: 2,
            },
            {
              question: "Existe evidência do despacho assinado pelo responsável da expedição?",
              type: ChecklistItemType.SIM_NAO,
              order: 3,
            },
            {
              question: "Observações da auditoria sobre o processo de saída",
              type: ChecklistItemType.TEXTO,
              order: 4,
            },
          ],
        },
      },
    }),
    prisma.checklist.create({
      data: {
        organizationId: organization.id,
        name: "Governança Documental - Saúde",
        description:
          "Checklist para validar políticas, licenças, treinamentos e organização documental.",
        category: "Documentação",
        version: 1,
        isActive: true,
        items: {
          create: [
            {
              question: "As licenças obrigatórias estão vigentes e arquivadas?",
              type: ChecklistItemType.SIM_NAO,
              order: 1,
            },
            {
              question: "Os POPs críticos estão revisados e assinados?",
              type: ChecklistItemType.SIM_NAO,
              order: 2,
            },
            {
              question: "Observações sobre maturidade documental",
              type: ChecklistItemType.TEXTO,
              order: 3,
            },
          ],
        },
      },
    }),
  ]);

  const completedAudit = await prisma.audit.create({
    data: {
      organizationId: organization.id,
      companyId: paoDaVida.id,
      createdById: mariaEduarda.id,
      assignedToId: mariaEduarda.id,
      title: "Auditoria interna de boas práticas - Unidade Bela Vista",
      description:
        "Avaliação de rotina em produção, rastreabilidade de lotes e controles de processo.",
      status: AuditStatus.COMPLETED,
      startDate: dates.jun01,
      dueDate: dates.jun10,
      endDate: dates.jun10,
      createdAt: dates.may28,
    },
  });

  const inProgressAudit = await prisma.audit.create({
    data: {
      organizationId: organization.id,
      companyId: petVita.id,
      createdById: mariaEduarda.id,
      assignedToId: klemberSilva.id,
      title: "Verificação de rastreabilidade e estoque - Centro de distribuição",
      description:
        "Auditoria focada em expedição, conferência de estoque e comprovação documental de despacho.",
      status: AuditStatus.IN_PROGRESS,
      startDate: dates.jun12,
      dueDate: dates.jun25,
      createdAt: dates.jun10,
    },
  });

  await prisma.audit.create({
    data: {
      organizationId: organization.id,
      companyId: clinicaFenix.id,
      createdById: masterAdmin.id,
      assignedToId: mariaEduarda.id,
      title: "Pré-auditoria documental de governança - Clínica Fênix",
      description:
        "Levantamento inicial de documentação obrigatória, licenças e organização de POPs.",
      status: AuditStatus.DRAFT,
      dueDate: dates.jun28,
      createdAt: dates.jun15,
    },
  });

  const completedAuditChecklist = await prisma.auditChecklist.create({
    data: {
      auditId: completedAudit.id,
      checklistId: checklistFood.id,
      checklistName: checklistFood.name,
      checklistDescription: checklistFood.description,
      checklistCategory: checklistFood.category,
      checklistVersion: checklistFood.version,
      status: AuditChecklistStatus.COMPLETED,
      auditorNote:
        "Operação bem organizada, com pequenos pontos de reforço documental e conferência.",
      auditorNoteVisibility: AuditorNoteVisibility.SHARED,
    },
  });

  const inProgressAuditChecklist = await prisma.auditChecklist.create({
    data: {
      auditId: inProgressAudit.id,
      checklistId: checklistLogistics.id,
      checklistName: checklistLogistics.name,
      checklistDescription: checklistLogistics.description,
      checklistCategory: checklistLogistics.category,
      checklistVersion: checklistLogistics.version,
      status: AuditChecklistStatus.IN_PROGRESS,
      auditorNote:
        "Processo de saída evoluiu bem, mas ainda há pontos de prova documental e divergência física.",
      auditorNoteVisibility: AuditorNoteVisibility.INTERNAL,
    },
  });

  const completedTemplateItems = await prisma.checklistItem.findMany({
    where: { checklistId: checklistFood.id },
    orderBy: { order: "asc" },
  });
  const inProgressTemplateItems = await prisma.checklistItem.findMany({
    where: { checklistId: checklistLogistics.id },
    orderBy: { order: "asc" },
  });

  const completedItems = await Promise.all(
    completedTemplateItems.map((item) =>
      prisma.auditChecklistItem.create({
        data: {
          auditChecklistId: completedAuditChecklist.id,
          sourceItemId: item.id,
          question: item.question,
          description: item.description,
          type: item.type,
          options: item.options ?? undefined,
          order: item.order,
          isRequired: item.isRequired,
        },
      }),
    ),
  );

  const progressItems = await Promise.all(
    inProgressTemplateItems.map((item) =>
      prisma.auditChecklistItem.create({
        data: {
          auditChecklistId: inProgressAuditChecklist.id,
          sourceItemId: item.id,
          question: item.question,
          description: item.description,
          type: item.type,
          options: item.options ?? undefined,
          order: item.order,
          isRequired: item.isRequired,
        },
      }),
    ),
  );

  await prisma.checklistResponse.createMany({
    data: [
      {
        auditId: completedAudit.id,
        auditChecklistItemId: completedItems[0].id,
        respondentId: mariaEduarda.id,
        updatedById: mariaEduarda.id,
        answerBoolean: true,
        notes: "Uniformização adequada em toda a linha observada.",
      },
      {
        auditId: completedAudit.id,
        auditChecklistItemId: completedItems[1].id,
        respondentId: mariaEduarda.id,
        updatedById: mariaEduarda.id,
        answerBoolean: true,
        notes: "Planilha diária preenchida e assinada pelo líder do turno.",
      },
      {
        auditId: completedAudit.id,
        auditChecklistItemId: completedItems[2].id,
        respondentId: mariaEduarda.id,
        updatedById: mariaEduarda.id,
        answerBoolean: false,
        notes: "Uma amostra de lote estava sem vinculação completa ao mapa de expedição.",
      },
      {
        auditId: completedAudit.id,
        auditChecklistItemId: completedItems[3].id,
        respondentId: mariaEduarda.id,
        updatedById: mariaEduarda.id,
        answerText:
          "Ambiente limpo, equipe treinada e controles consistentes. Ajuste pontual em rastreabilidade documental.",
      },
      {
        auditId: inProgressAudit.id,
        auditChecklistItemId: progressItems[0].id,
        respondentId: klemberSilva.id,
        updatedById: klemberSilva.id,
        answerBoolean: true,
        notes: "Romaneio principal com lote e validade conferidos.",
      },
      {
        auditId: inProgressAudit.id,
        auditChecklistItemId: progressItems[1].id,
        respondentId: klemberSilva.id,
        updatedById: klemberSilva.id,
        answerBoolean: false,
        notes: "Divergência entre estoque físico e sistema em dois itens de giro alto.",
      },
      {
        auditId: inProgressAudit.id,
        auditChecklistItemId: progressItems[2].id,
        respondentId: klemberSilva.id,
        updatedById: klemberSilva.id,
        answerBoolean: false,
        notes: "Despacho do turno noturno sem comprovante assinado anexado.",
      },
      {
        auditId: inProgressAudit.id,
        auditChecklistItemId: progressItems[3].id,
        respondentId: klemberSilva.id,
        updatedById: klemberSilva.id,
        answerText:
          "Equipe colaborativa, porém com fragilidade na guarda da comprovação documental da expedição.",
      },
    ],
  });

  const completedNc = await prisma.nonConformity.create({
    data: {
      auditId: completedAudit.id,
      auditChecklistItemId: completedItems[2].id,
      createdById: mariaEduarda.id,
      responsibleId: clientPaoDaVida.id,
      title: "Rastreabilidade incompleta em lote de panificados congelados",
      description:
        "Foi identificada ausência de amarração completa entre lote expedido e registro de destino final em uma amostra auditada.",
      severity: Severity.MEDIUM,
      status: NonConformityStatus.RESOLVED,
      correctionDeadline: dates.jun18,
      correctionNotes:
        "Procedimento corrigido com revisão do mapa de expedição e reforço na conferência do lote.",
      resolvedAt: dates.jun15,
    },
  });

  const openNc = await prisma.nonConformity.create({
    data: {
      auditId: inProgressAudit.id,
      auditChecklistItemId: progressItems[1].id,
      createdById: klemberSilva.id,
      responsibleId: clientPetVita.id,
      title: "Divergência entre estoque físico e sistema",
      description:
        "Itens de giro alto apresentaram diferença entre quantidade física e saldo registrado no sistema.",
      severity: Severity.HIGH,
      status: NonConformityStatus.OPEN,
      correctionDeadline: dates.jun22,
    },
  });

  const progressNc = await prisma.nonConformity.create({
    data: {
      auditId: inProgressAudit.id,
      auditChecklistItemId: progressItems[2].id,
      createdById: klemberSilva.id,
      responsibleId: clientPetVita.id,
      title: "Ausência de comprovante assinado no despacho noturno",
      description:
        "Saídas do turno noturno não estavam acompanhadas de evidência assinada do responsável pela expedição.",
      severity: Severity.MEDIUM,
      status: NonConformityStatus.IN_PROGRESS,
      correctionDeadline: dates.jun20,
      correctionNotes:
        "Cliente informou que está digitalizando os comprovantes e revisando a rotina do turno.",
    },
  });

  const approvedPlan = await prisma.actionPlan.create({
    data: {
      nonConformityId: completedNc.id,
      createdById: mariaEduarda.id,
      responsibleId: clientPaoDaVida.id,
      title: "Padronizar conferência de lote na expedição",
      description:
        "Revisar o procedimento de conferência de lote e implantar dupla checagem no fechamento do despacho.",
      status: ActionPlanStatus.APPROVED,
      priority: Severity.MEDIUM,
      dueDate: dates.jun18,
      completedAt: dates.jun15,
      notes: "Plano concluído e validado pela auditora.",
    },
  });

  const openPlan = await prisma.actionPlan.create({
    data: {
      nonConformityId: openNc.id,
      createdById: klemberSilva.id,
      responsibleId: clientPetVita.id,
      title: "Ajustar contagem cíclica de estoque de itens críticos",
      description:
        "Executar reconciliação entre estoque físico e sistema, com plano de revisão semanal.",
      status: ActionPlanStatus.OPEN,
      priority: Severity.HIGH,
      dueDate: dates.jun22,
      notes: "Aguardando início formal da reconciliação.",
    },
  });

  const reviewPlan = await prisma.actionPlan.create({
    data: {
      nonConformityId: progressNc.id,
      createdById: klemberSilva.id,
      responsibleId: clientPetVita.id,
      title: "Formalizar evidência de despacho do turno noturno",
      description:
        "Implantar assinatura obrigatória e anexar a comprovação na rotina diária de expedição.",
      status: ActionPlanStatus.AWAITING_REVIEW,
      priority: Severity.MEDIUM,
      dueDate: dates.jun20,
      notes: "Cliente enviou evidência inicial para validação.",
    },
  });

  await prisma.actionPlanHistory.createMany({
    data: [
      {
        actionPlanId: approvedPlan.id,
        userId: mariaEduarda.id,
        action: "Plano criado pela auditora.",
      },
      {
        actionPlanId: approvedPlan.id,
        userId: clientPaoDaVida.id,
        action: "Plano concluído pela empresa auditada.",
      },
      {
        actionPlanId: approvedPlan.id,
        userId: mariaEduarda.id,
        action: "Plano aprovado após validação final.",
      },
      {
        actionPlanId: openPlan.id,
        userId: klemberSilva.id,
        action: "Plano aberto aguardando execução operacional.",
      },
      {
        actionPlanId: reviewPlan.id,
        userId: clientPetVita.id,
        action: "Resposta enviada com evidência para revisão.",
      },
    ],
  });

  const approvedEvidence = await prisma.evidence.create({
    data: {
      auditId: completedAudit.id,
      actionPlanId: approvedPlan.id,
      nonConformityId: completedNc.id,
      auditChecklistItemId: completedItems[2].id,
      attachedById: clientPaoDaVida.id,
      reviewedById: mariaEduarda.id,
      title: "Mapa de expedição revisado com conferência de lote",
      description:
        "Documento revisado após correção do processo de rastreabilidade da expedição.",
      fileUrl: "https://arquivos.demo/pao-da-vida/mapa-expedicao-revisado.pdf",
      origin: EvidenceOrigin.EMPRESA,
      status: EvidenceStatus.APPROVED,
      reviewNotes: "Comprovação suficiente para encerramento da não conformidade.",
      reviewedAt: dates.jun15,
    },
  });

  const pendingEvidence = await prisma.evidence.create({
    data: {
      auditId: inProgressAudit.id,
      actionPlanId: reviewPlan.id,
      nonConformityId: progressNc.id,
      auditChecklistItemId: progressItems[2].id,
      attachedById: clientPetVita.id,
      title: "Comprovante digital do despacho noturno",
      description:
        "Cliente anexou a primeira rotina digitalizada do turno noturno para validação.",
      fileUrl: "https://arquivos.demo/petvita/comprovante-despacho-noturno.pdf",
      origin: EvidenceOrigin.EMPRESA,
      status: EvidenceStatus.PENDING,
    },
  });

  await prisma.auditDocument.createMany({
    data: [
      {
        auditId: completedAudit.id,
        actionPlanId: approvedPlan.id,
        evidenceId: approvedEvidence.id,
        attachedById: mariaEduarda.id,
        title: "Relatório fotográfico da área de expedição",
        description: "Registro visual usado como apoio ao fechamento do parecer.",
        category: "Relatório fotográfico",
        fileUrl: "https://arquivos.demo/pao-da-vida/relatorio-fotografico.pdf",
        origin: AuditDocumentOrigin.AUDITORIA,
      },
      {
        auditId: inProgressAudit.id,
        actionPlanId: reviewPlan.id,
        evidenceId: pendingEvidence.id,
        attachedById: clientPetVita.id,
        title: "Procedimento interno do turno noturno",
        description: "Procedimento enviado pela empresa para apoiar a revisão do plano.",
        category: "Procedimento",
        fileUrl: "https://arquivos.demo/petvita/procedimento-turno-noturno.pdf",
        origin: AuditDocumentOrigin.EMPRESA,
      },
    ],
  });

  await prisma.auditOpinion.create({
    data: {
      auditId: completedAudit.id,
      responsibleId: mariaEduarda.id,
      companyBrief:
        "Empresa com rotina operacional madura e equipe treinada, apresentando boa organização do processo produtivo.",
      generalCare:
        "A operação demonstra atenção consistente à higiene, aos registros e ao comportamento da equipe durante a auditoria.",
      positivePoints:
        "Disciplina operacional, registros diários atualizados e abertura da equipe para correções pontuais.",
      criticalPoints:
        "Rastreabilidade documental ainda depende de reforço em conferências finais da expedição.",
      overallPerformance:
        "Desempenho satisfatório, com aderência geral ao padrão esperado para o escopo auditado.",
      identifiedRisks:
        "Risco moderado de perda de rastreabilidade em casos de fechamento manual sem segunda conferência.",
      recommendations:
        "Manter o plano validado em prática por 30 dias e revisar indicadores de conformidade na próxima visita.",
      finalOpinion:
        "A auditoria foi concluída com bom nível de aderência operacional. Houve um desvio pontual de rastreabilidade, já tratado com ação corretiva validada e evidência aprovada. Recomenda-se acompanhamento de manutenção da rotina implantada.",
      status: AuditOpinionStatus.COMPLETED,
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        organizationId: organization.id,
        userId: mariaEduarda.id,
        type: NotificationType.AUDIT_COMPLETED,
        title: "Auditoria finalizada",
        message: "Pão da Vida Alimentos Ltda.: relatório final pronto para envio.",
        href: `/audits/${completedAudit.id}`,
      },
      {
        organizationId: organization.id,
        userId: mariaEduarda.id,
        type: NotificationType.EVIDENCE_CREATED,
        title: "Evidência anexada",
        message: "PetVita enviou evidência para validação do plano de despacho noturno.",
        href: `/audits/${inProgressAudit.id}#verificacao`,
      },
      {
        organizationId: organization.id,
        userId: klemberSilva.id,
        type: NotificationType.NON_CONFORMITY_CREATED,
        title: "Não conformidade criada",
        message: "Foi registrada divergência entre estoque físico e sistema na PetVita.",
        href: `/audits/${inProgressAudit.id}#ncs`,
      },
      {
        organizationId: organization.id,
        userId: masterAdmin.id,
        type: NotificationType.SYSTEM,
        title: "Base de demonstração atualizada",
        message: "Os dados de exemplo foram substituídos por uma massa fictícia de apresentação.",
        href: "/dashboard",
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        organizationId: organization.id,
        auditId: completedAudit.id,
        action: "COMPLETED",
        entity: "AUDIT",
        changes: JSON.stringify({ status: "COMPLETED" }),
      },
      {
        organizationId: organization.id,
        auditId: inProgressAudit.id,
        nonConformityId: openNc.id,
        action: "NC_CREATED",
        entity: "NON_CONFORMITY",
        changes: JSON.stringify({ severity: "HIGH", status: "OPEN" }),
      },
    ],
  });

  const [companiesCount, auditsCount, checklistsCount, ncsCount, plansCount] =
    await Promise.all([
      prisma.company.count(),
      prisma.audit.count(),
      prisma.checklist.count(),
      prisma.nonConformity.count(),
      prisma.actionPlan.count(),
    ]);

  console.log("Seed completed with realistic fictional data.");
  console.log(`Organization: ${organization.name}`);
  console.log(`Companies: ${companiesCount}`);
  console.log(`Audits: ${auditsCount}`);
  console.log(`Checklists: ${checklistsCount}`);
  console.log(`Non-conformities: ${ncsCount}`);
  console.log(`Action plans: ${plansCount}`);
  console.log("Primary access:");
  console.log("  Admin master -> suportegrothsul@gmail.com / Groth@123");
  console.log("  Auditora admin -> maria.eduarda@solutions.local / Maria@123");
  console.log("  Consultor -> klember.silva@solutions.local / Klember@123");
}

main()
  .catch((error) => {
    console.error("Seed failed.");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
