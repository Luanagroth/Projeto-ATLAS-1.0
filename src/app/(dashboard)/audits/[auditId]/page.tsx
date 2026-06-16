import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { hasRole, requireAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { AuditChecklistsPanel } from "@/features/audit-checklists/components/audit-checklists-panel";
import {
  getAuditChecklistExecution,
  listAvailableChecklistTemplates,
} from "@/features/audit-checklists/services/audit-checklist-service";
import { AuditActionPlansPanel } from "@/features/audits/components/audit-action-plans-panel";
import { AuditFinalReportPanel } from "@/features/audits/components/audit-final-report-panel";
import { AuditDetailsCard } from "@/features/audits/components/audit-details-card";
import { AuditDocumentsPanel } from "@/features/audits/components/audit-documents-panel";
import { AuditEvidencesPanel } from "@/features/audits/components/audit-evidences-panel";
import { AuditHistoryPanel } from "@/features/audits/components/audit-history-panel";
import { AuditNonConformitiesPanel } from "@/features/audits/components/audit-non-conformities-panel";
import { AuditOperationalOverview } from "@/features/audits/components/audit-operational-overview";
import { AuditOpinionPanel } from "@/features/audits/components/audit-opinion-panel";
import { AuditPossibleIrregularitiesPanel } from "@/features/audits/components/audit-possible-irregularities-panel";
import { AuditWorkflowGuide } from "@/features/audits/components/audit-workflow-guide";
import { AuditWorkflowFocus } from "@/features/audits/components/audit-workflow-focus";
import { AuditVerificationPanel } from "@/features/audits/components/audit-verification-panel";
import { AuditWorkspaceSection } from "@/features/audits/components/audit-workspace-section";
import { isAuditEditable } from "@/features/audits/schemas/audit-schema";
import {
  getAuditDocumentLinkOptions,
  listAuditDocumentCategories,
  listAuditDocuments,
} from "@/features/audits/services/audit-document-service";
import { getAuditOpinionForAudit } from "@/features/audits/services/audit-opinion-service";
import {
  getAuditActionPlans,
  getAuditByIdForOrganization,
  getAuditEvidenceItems,
  getAuditHistory,
  getAuditNonConformities,
  getAuditOperationalOverview,
  getAuditVerificationItems,
} from "@/features/audits/services/audit-service";
import { ScrollToTop } from "@/components/layout/scroll-to-top";

type AuditPageProps = {
  params: Promise<{ auditId: string }>;
  searchParams?: Promise<{
    created?: string;
    deleted?: string;
    docCategory?: string;
    docOrigin?: string;
    nc?: string;
    plan?: string;
    status?: string;
  }>;
};

const checklistExecutionRoles = ["ADMIN", "CONSULTANT"] as const;
const nonConformityEditorRoles = ["ADMIN", "CONSULTANT"] as const;
const statusEditorRoles = ["ADMIN", "CONSULTANT"] as const;

const auditSectionOrder = [
  "checklists",
  "irregularidades",
  "ncs",
  "planos",
  "parecer",
  "relatorio",
  "documentos",
  "evidencias",
  "verificacao",
  "historico",
] as const;

type AuditSectionId = (typeof auditSectionOrder)[number];
type AuditSectionStatus = "done" | "current" | "pending" | "neutral";

function checklistHasPendingItems(
  appliedChecklists: Awaited<ReturnType<typeof getAuditChecklistExecution>>,
) {
  return (
    appliedChecklists.length === 0 ||
    appliedChecklists.some((checklist) =>
      checklist.items.some((item) => item.responses.length === 0),
    )
  );
}

function countActionPlansByStatus(
  actionPlans: Awaited<ReturnType<typeof getAuditActionPlans>>,
) {
  return actionPlans.reduce(
    (counts, plan) => {
      if (plan.status === "AWAITING_REVIEW") {
        counts.awaitingReview += 1;
        return counts;
      }

      if (plan.status === "APPROVED" || plan.status === "REJECTED") {
        counts.finalized += 1;
        return counts;
      }

      counts.active += 1;
      return counts;
    },
    { active: 0, awaitingReview: 0, finalized: 0 },
  );
}

function possibleIrregularitiesCount(
  appliedChecklists: Awaited<ReturnType<typeof getAuditChecklistExecution>>,
) {
  return appliedChecklists.reduce((total, checklist) => {
    return (
      total +
      checklist.items.filter((item) => {
        const response = item.responses[0];

        return (
          response?.answerBoolean === false &&
          item.nonConformities.length === 0
        );
      }).length
    );
  }, 0);
}

function resolveAuditWorkflowStage({
  activeActionPlansCount,
  actionPlansCount,
  auditStatus,
  canCreateNonConformity,
  checklistPending,
  pendingNonConformitiesCount,
  opinionCompleted,
  plansAwaitingResponse,
  plansInVerification,
  possibleIrregularities,
  role,
}: {
  actionPlansCount: number;
  activeActionPlansCount: number;
  auditStatus: string;
  canCreateNonConformity: boolean;
  checklistPending: boolean;
  pendingNonConformitiesCount: number;
  opinionCompleted: boolean;
  plansAwaitingResponse: number;
  plansInVerification: number;
  possibleIrregularities: number;
  role: "ADMIN" | "CONSULTANT" | "CLIENT";
}): AuditSectionId {
  if (role === "CLIENT") {
    if (plansAwaitingResponse > 0) return "planos";
    if (plansInVerification > 0) return "verificacao";
    if (activeActionPlansCount > 0 || actionPlansCount > 0) return "planos";

    return "historico";
  }

  if (checklistPending) return "checklists";
  if (possibleIrregularities > 0 && canCreateNonConformity) return "irregularidades";
  if (pendingNonConformitiesCount > 0) return "ncs";
  if (activeActionPlansCount > 0) return "planos";
  if (plansAwaitingResponse > 0 || plansInVerification > 0) return "verificacao";
  if (!opinionCompleted && auditStatus !== "DRAFT") return "parecer";
  if (opinionCompleted && auditStatus !== "COMPLETED") return "relatorio";

  return "historico";
}

function sectionStatus(
  sectionId: AuditSectionId,
  currentSection: AuditSectionId,
): AuditSectionStatus {
  const currentIndex = auditSectionOrder.indexOf(currentSection);
  const sectionIndex = auditSectionOrder.indexOf(sectionId);

  if (sectionIndex < currentIndex) return "done";
  if (sectionIndex === currentIndex) return "current";

  return "pending";
}

function previousSectionHref(sectionId: AuditSectionId) {
  const sectionIndex = auditSectionOrder.indexOf(sectionId);

  if (sectionIndex <= 0) {
    return "/audits";
  }

  return `#${auditSectionOrder[sectionIndex - 1]}`;
}

export default async function AuditPage({ params, searchParams }: AuditPageProps) {
  const user = await requireAuth();
  if (!user.organizationId) redirect("/dashboard");

  const { auditId } = await params;
  const feedback = await searchParams;

  const [
    audit,
    appliedChecklists,
    availableTemplates,
    nonConformities,
    actionPlans,
    evidences,
    verificationItems,
    overview,
    opinion,
    documents,
    documentCategories,
    documentLinkOptions,
    history,
  ] = await Promise.all([
    getAuditByIdForOrganization({ auditId, organizationId: user.organizationId }),
    getAuditChecklistExecution({ auditId, organizationId: user.organizationId }),
    listAvailableChecklistTemplates(user.organizationId),
    getAuditNonConformities({ auditId, organizationId: user.organizationId }),
    getAuditActionPlans({ auditId, organizationId: user.organizationId }),
    getAuditEvidenceItems({ auditId, organizationId: user.organizationId }),
    getAuditVerificationItems({ auditId, organizationId: user.organizationId }),
    getAuditOperationalOverview({ auditId, organizationId: user.organizationId }),
    getAuditOpinionForAudit({ auditId, organizationId: user.organizationId }),
    listAuditDocuments({
      auditId,
      organizationId: user.organizationId,
      origin: feedback?.docOrigin,
      category: feedback?.docCategory,
    }),
    listAuditDocumentCategories({ auditId, organizationId: user.organizationId }),
    getAuditDocumentLinkOptions({ auditId, organizationId: user.organizationId }),
    getAuditHistory({ auditId, organizationId: user.organizationId }),
  ]);

  if (!audit) notFound();

  const canExecuteChecklists = hasRole(user, checklistExecutionRoles);
  const canCreateNonConformity = hasRole(user, nonConformityEditorRoles);
  const canChangeStatus = hasRole(user, statusEditorRoles);
  const auditIsEditable = isAuditEditable(audit.status);
  const canWorkOnAudit = auditIsEditable && canCreateNonConformity;
  const canWorkOnChecklists = auditIsEditable && canExecuteChecklists;
  const possibleIrregularities = possibleIrregularitiesCount(appliedChecklists);
  const checklistPending = checklistHasPendingItems(appliedChecklists);
  const nonConformitiesWithoutPlans = nonConformities.filter(
    (nonConformity) => nonConformity._count.actionPlans === 0,
  ).length;
  const actionPlanCounts = countActionPlansByStatus(actionPlans);
  const opinionCompleted = overview.opinionStatus === "COMPLETED";
  const currentSection = resolveAuditWorkflowStage({
    activeActionPlansCount: actionPlanCounts.active,
    actionPlansCount: actionPlans.length,
    auditStatus: audit.status,
    canCreateNonConformity: canWorkOnAudit,
    checklistPending,
    pendingNonConformitiesCount: nonConformitiesWithoutPlans,
    opinionCompleted,
    plansAwaitingResponse: overview.plansAwaitingResponse,
    plansInVerification: overview.plansInVerification,
    possibleIrregularities,
    role: user.role,
  });

  const feedbackMessage =
    feedback?.created === "1"
      ? "Auditoria criada com sucesso."
      : feedback?.status === "1"
        ? "Status da auditoria atualizado."
        : feedback?.nc === "1"
          ? "Não conformidade salva. Auditoria atualizada."
          : feedback?.plan === "1"
            ? "Plano de ação salvo. Auditoria atualizada."
            : feedback?.deleted === "1"
              ? "Item excluido."
              : null;

  return (
    <div className="space-y-6">
      <ScrollToTop />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            <Link className="hover:underline" href="/audits">
              Auditorias
            </Link>
            {" / "}
            <span>{audit.company.name}</span>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {audit.title}
          </h1>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {audit.status === "COMPLETED" ? (
            <Button asChild className="w-full sm:w-auto" size="sm">
              <Link href={`/reports/audits/${audit.id}`} target="_blank">
                Exportar / enviar
              </Link>
            </Button>
          ) : null}
          <Button asChild className="w-full sm:w-auto" size="sm" variant="outline">
            <Link href="/audits">Voltar para auditorias</Link>
          </Button>
        </div>
      </div>

      {feedbackMessage ? (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          {feedbackMessage}
        </p>
      ) : null}

      <AuditDetailsCard audit={audit} canChangeStatus={canChangeStatus} />
      <AuditOperationalOverview audit={audit} overview={overview} />
      <AuditWorkflowFocus sectionId={currentSection} />

      <AuditWorkflowGuide
        activeActionPlansCount={actionPlanCounts.active}
        actionPlansCount={actionPlans.length}
        appliedChecklistsCount={appliedChecklists.length}
        auditId={audit.id}
        auditStatus={audit.status}
        canCreateNonConformity={canWorkOnAudit}
        canExecuteChecklists={canWorkOnChecklists}
        checklistPending={checklistPending}
        nonConformitiesCount={nonConformities.length}
        pendingNonConformitiesCount={nonConformitiesWithoutPlans}
        opinionCompleted={opinionCompleted}
        plansAwaitingResponse={overview.plansAwaitingResponse}
        plansInVerification={overview.plansInVerification}
        possibleIrregularities={possibleIrregularities}
        role={user.role}
      />

      <nav className="grid gap-2 text-sm sm:grid-cols-3 lg:grid-cols-9">
        <a className="rounded-md border bg-background px-3 py-2 hover:bg-muted" href="#checklists">
          1. Checklist
        </a>
        <a className="rounded-md border bg-background px-3 py-2 hover:bg-muted" href="#irregularidades">
          2. Irregularidades
        </a>
        <a className="rounded-md border bg-background px-3 py-2 hover:bg-muted" href="#ncs">
          3. NCs
        </a>
        <a className="rounded-md border bg-background px-3 py-2 hover:bg-muted" href="#planos">
          4. Planos
        </a>
        <a className="rounded-md border bg-background px-3 py-2 hover:bg-muted" href="#parecer">
          5. Parecer
        </a>
        <a className="rounded-md border bg-background px-3 py-2 hover:bg-muted" href="#relatorio">
          6. Relatório
        </a>
        <a className="rounded-md border bg-background px-3 py-2 hover:bg-muted" href="#documentos">
          7. Documentos
        </a>
        <a className="rounded-md border bg-background px-3 py-2 hover:bg-muted" href="#evidencias">
          8. Evidências
        </a>
        <a className="rounded-md border bg-background px-3 py-2 hover:bg-muted" href="#verificacao">
          9. Verificação
        </a>
        <a className="rounded-md border bg-background px-3 py-2 hover:bg-muted" href="#historico">
          10. Histórico
        </a>
      </nav>

      <section className="space-y-3">
        <AuditWorkspaceSection
          count={appliedChecklists.length}
          backHref={previousSectionHref("checklists")}
          backLabel="Voltar para auditorias"
          defaultOpen={false}
          description="Responda os itens. Não conformes seguem para revisão antes de virar NC."
          id="checklists"
          status={sectionStatus("checklists", currentSection)}
          title="1. Checklist"
        >
          <AuditChecklistsPanel
            appliedChecklists={appliedChecklists}
            auditId={audit.id}
            canExecute={canWorkOnChecklists}
            templates={availableTemplates}
          />
        </AuditWorkspaceSection>

        <AuditWorkspaceSection
          count={possibleIrregularities}
          backHref={previousSectionHref("irregularidades")}
          backLabel="Voltar ao checklist"
          defaultOpen={false}
          description="Revise antes de formalizar NC. Resposta sozinha nao cria NC automaticamente."
          id="irregularidades"
          status={sectionStatus("irregularidades", currentSection)}
          title="2. Possíveis irregularidades"
        >
          <AuditPossibleIrregularitiesPanel
            appliedChecklists={appliedChecklists}
            auditId={audit.id}
            canCreate={canWorkOnAudit}
          />
        </AuditWorkspaceSection>

        <AuditWorkspaceSection
          count={nonConformities.length}
          backHref={previousSectionHref("ncs")}
          backLabel="Voltar às irregularidades"
          defaultOpen={false}
          description="Problemas formalizados pela auditora."
          id="ncs"
          status={sectionStatus("ncs", currentSection)}
          title="3. Não conformidades"
        >
          <AuditNonConformitiesPanel
            auditId={audit.id}
            canCreate={canWorkOnAudit}
            items={nonConformities}
          />
        </AuditWorkspaceSection>

        <AuditWorkspaceSection
          count={actionPlans.length}
          backHref={previousSectionHref("planos")}
          backLabel="Voltar às NCs"
          defaultOpen={false}
          description="Planos nascem de NC e exibem os itens de checklist que devem atender."
          id="planos"
          status={sectionStatus("planos", currentSection)}
          title="4. Planos de ação"
        >
          <AuditActionPlansPanel
            auditId={audit.id}
            canCreate={canWorkOnAudit}
            items={actionPlans}
          />
        </AuditWorkspaceSection>

        <AuditWorkspaceSection
          count={opinion?.status === "COMPLETED" ? 1 : 0}
          backHref={previousSectionHref("parecer")}
          backLabel="Voltar aos planos"
          defaultOpen={false}
          description="Analise qualitativa da empresa e conclusao tecnica da auditora."
          id="parecer"
          status={sectionStatus("parecer", currentSection)}
          title="5. Parecer da auditora"
        >
          <AuditOpinionPanel
            auditId={audit.id}
            canEdit={canWorkOnAudit}
            opinion={opinion}
          />
        </AuditWorkspaceSection>

        <AuditWorkspaceSection
          count={audit.status === "COMPLETED" ? 1 : 0}
          backHref={previousSectionHref("relatorio")}
          backLabel="Voltar ao parecer"
          defaultOpen={false}
          description="Consolide o fechamento tecnico antes de selar a auditoria."
          id="relatorio"
          status={sectionStatus("relatorio", currentSection)}
          title="6. Relatório final"
        >
          <AuditFinalReportPanel
            actionPlans={actionPlans}
            appliedChecklists={appliedChecklists}
            audit={audit}
            auditId={audit.id}
            nonConformities={nonConformities}
            opinion={opinion}
            overview={overview}
          />
        </AuditWorkspaceSection>

        <AuditWorkspaceSection
          count={documents.length}
          backHref={previousSectionHref("documentos")}
          backLabel="Voltar ao relatório"
          defaultOpen={false}
          description="Documentos gerais usados na auditoria. Esta área é apenas consulta."
          id="documentos"
          status="neutral"
          title="7. Documentos"
        >
          <AuditDocumentsPanel
            auditId={audit.id}
            canManage={canWorkOnAudit}
            categories={documentCategories}
            documents={documents}
            linkOptions={documentLinkOptions}
            selectedCategory={feedback?.docCategory}
            selectedOrigin={feedback?.docOrigin}
          />
        </AuditWorkspaceSection>

        <AuditWorkspaceSection
          count={
            evidences.actionPlanEvidences.length +
            evidences.checklistItemEvidences.length
          }
          backHref={previousSectionHref("evidencias")}
          backLabel="Voltar aos documentos"
          defaultOpen={false}
          description="Evidências anexadas nesta auditoria. Área neutra para consulta."
          id="evidencias"
          status="neutral"
          title="8. Evidências"
        >
          <AuditEvidencesPanel auditId={audit.id} items={evidences} />
        </AuditWorkspaceSection>

        <AuditWorkspaceSection
          count={verificationItems.length}
          backHref={previousSectionHref("verificacao")}
          backLabel="Voltar às evidências"
          defaultOpen={false}
          description="Valide evidencias e respostas enviadas pela empresa ou anexadas pela auditoria."
          id="verificacao"
          status={sectionStatus("verificacao", currentSection)}
          title="9. Verificação da auditoria"
        >
          <AuditVerificationPanel auditId={audit.id} items={verificationItems} />
        </AuditWorkspaceSection>

        <AuditWorkspaceSection
          count={history.length}
          backHref={previousSectionHref("historico")}
          backLabel="Voltar à verificação"
          defaultOpen={false}
          description="Rastreabilidade da auditoria. Área neutra para consulta futura."
          id="historico"
          status="neutral"
          title="10. Histórico"
        >
          <AuditHistoryPanel items={history} />
        </AuditWorkspaceSection>
      </section>
    </div>
  );
}
