import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireAuth } from "@/auth";
import { getAuditChecklistExecution } from "@/features/audit-checklists/services/audit-checklist-service";
import { AuditReportPrintActions } from "@/features/audits/components/audit-report-print-actions";
import {
  auditReportUserName,
  buildAuditFinalReport,
  buildOpinionSummary,
  formatAuditReportDate,
  formatAuditReportDateTime,
} from "@/features/audits/lib/final-report";
import { auditStatusLabels } from "@/features/audits/schemas/audit-schema";
import { listAuditDocuments } from "@/features/audits/services/audit-document-service";
import { getAuditOpinionForAudit } from "@/features/audits/services/audit-opinion-service";
import {
  getAuditActionPlans,
  getAuditByIdForOrganization,
  getAuditEvidenceItems,
  getAuditNonConformities,
  getAuditOperationalOverview,
} from "@/features/audits/services/audit-service";
import { getOrganizationSettings } from "@/features/settings/services/settings-service";

type AuditReportPageProps = {
  params: Promise<{ auditId: string }>;
};

function Section({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm print:break-inside-avoid print:rounded-none print:border-slate-300 print:p-5 print:shadow-none">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function InfoLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 py-2 last:border-b-0">
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <span className="text-right text-sm text-slate-800">{value}</span>
    </div>
  );
}

export default async function AuditReportPage({
  params,
}: AuditReportPageProps) {
  const user = await requireAuth();

  if (!user.organizationId) {
    redirect("/dashboard");
  }

  const { auditId } = await params;
  const organizationId = user.organizationId;

  const [
    audit,
    organization,
    appliedChecklists,
    nonConformities,
    actionPlans,
    overview,
    opinion,
    evidences,
    documents,
  ] = await Promise.all([
    getAuditByIdForOrganization({ auditId, organizationId }),
    getOrganizationSettings(organizationId),
    getAuditChecklistExecution({ auditId, organizationId }),
    getAuditNonConformities({ auditId, organizationId }),
    getAuditActionPlans({ auditId, organizationId }),
    getAuditOperationalOverview({ auditId, organizationId }),
    getAuditOpinionForAudit({ auditId, organizationId }),
    getAuditEvidenceItems({ auditId, organizationId }),
    listAuditDocuments({ auditId, organizationId }),
  ]);

  if (!audit || !organization) {
    notFound();
  }

  if (audit.status !== "COMPLETED") {
    redirect(`/audits/${auditId}#relatorio`);
  }

  const reportText = buildAuditFinalReport({
    actionPlans,
    appliedChecklists,
    audit,
    nonConformities,
    opinion,
    overview,
  });
  const opinionSummary = buildOpinionSummary(opinion);
  const totalEvidences =
    evidences.actionPlanEvidences.length + evidences.checklistItemEvidences.length;
  const executiveSummary = [
    `A auditoria "${audit.title}" foi concluída com ${overview.nonConformingItems} item(ns) não conforme(s) registrado(s) e ${nonConformities.length} não conformidade(s) formalizada(s).`,
    overview.ncsOpen > 0
      ? `Permanecem ${overview.ncsOpen} não conformidade(s) em aberto, exigindo acompanhamento e plano de resposta.`
      : "Não há não conformidades abertas no momento do fechamento.",
    actionPlans.length > 0
      ? `Foram consolidados ${actionPlans.length} plano(s) de acao para tratamento e rastreabilidade dos apontamentos.`
      : "Não foi necessário abrir plano de ação para esta auditoria.",
  ];

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <AuditReportPrintActions backHref={`/audits/${auditId}`} />

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 print:max-w-none print:gap-4 print:px-0 print:py-0">
        <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl print:rounded-none print:border-0 print:shadow-none">
          <header className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(135deg,#071221_0%,#0f172a_45%,#1e293b_100%)] px-6 py-8 text-white print:px-8 print:py-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,119,6,0.28),transparent_38%)]" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/8 p-3 ring-1 ring-white/15 backdrop-blur">
                  <Image
                    alt={organization.logo ? `Logo de ${organization.name}` : "Atlas"}
                    className="h-full w-full object-contain"
                    height={56}
                    src={organization.logo ?? "/icon.svg"}
                    width={56}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
                    Atlas · Sistema de Auditorias
                  </p>
                  <h1 className="text-3xl font-semibold tracking-tight">
                    Relatório final da auditoria
                  </h1>
                  <p className="max-w-2xl text-sm text-slate-200">
                    Documento consolidado para consulta interna, envio a empresas
                    e arquivamento tecnico.
                  </p>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs font-medium text-slate-100">
                    <span className="text-amber-300">Documento</span>
                    <span>Relatório Final de Auditoria</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/6 p-4 text-sm text-slate-100 backdrop-blur">
                <p className="font-semibold">{organization.name}</p>
                <p>CNPJ: {organization.cnpj ?? "Não informado"}</p>
                <p>E-mail: {organization.email ?? "Não informado"}</p>
                <p>Telefone: {organization.phone ?? "Não informado"}</p>
                <p>Endereço: {organization.address ?? "Não informado"}</p>
              </div>
            </div>
          </header>

          <div className="space-y-6 px-6 py-6 print:px-8 print:py-6">
            <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Auditoria concluída
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-900">
                  {audit.title}
                </h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                      Empresa auditada
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-900">
                      {audit.company.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      CNPJ: {audit.company.cnpj ?? "Não informado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                      Status
                    </p>
                    <p className="mt-2 text-base font-semibold text-emerald-700">
                      {auditStatusLabels[audit.status]}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Selada em {formatAuditReportDateTime(audit.endDate)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <MetricCard label="Checklists" value={overview.checklistsApplied} />
                <MetricCard label="NCs abertas" value={overview.ncsOpen} />
                <MetricCard label="Planos" value={actionPlans.length} />
                <MetricCard label="Evidências" value={totalEvidences} />
              </div>
            </section>

            <Section title="Resumo executivo">
              <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border border-amber-200 bg-[linear-gradient(135deg,rgba(245,158,11,0.08),rgba(255,255,255,1))] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                    Sintese para envio
                  </p>
                  <div className="mt-3 space-y-3 text-sm leading-7 text-slate-700">
                    {executiveSummary.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Controle do documento
                  </p>
                  <div className="mt-3">
                    <InfoLine
                      label="Emissao"
                      value={formatAuditReportDateTime(new Date())}
                    />
                    <InfoLine label="Organização" value={organization.name} />
                    <InfoLine
                      label="Responsável"
                      value={auditReportUserName(
                        opinion?.responsible ?? audit.assignedTo,
                      )}
                    />
                    <InfoLine
                      label="Tipo"
                      value="Relatório final de auditoria"
                    />
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Identificação e rastreabilidade">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                    Criada em
                  </p>
                  <p className="mt-2 text-sm text-slate-800">
                    {formatAuditReportDateTime(audit.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                    Início
                  </p>
                  <p className="mt-2 text-sm text-slate-800">
                    {formatAuditReportDate(audit.startDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                    Prazo
                  </p>
                  <p className="mt-2 text-sm text-slate-800">
                    {formatAuditReportDate(audit.dueDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                    Responsável técnico
                  </p>
                  <p className="mt-2 text-sm text-slate-800">
                    {auditReportUserName(opinion?.responsible ?? audit.assignedTo)}
                  </p>
                </div>
              </div>
            </Section>

            <Section title="Resumo operacional">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Itens conformes"
                  value={overview.conformingItems}
                />
                <MetricCard
                  label="Itens não conformes"
                  value={overview.nonConformingItems}
                />
                <MetricCard
                  label="Planos em verificação"
                  value={overview.plansInVerification}
                />
                <MetricCard
                  label="Docs vinculados"
                  value={overview.documentsCount}
                />
              </div>
            </Section>

            <Section title="Parecer da auditora">
              <div className="space-y-4 text-sm leading-7 text-slate-700">
                {opinionSummary.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
                    Conclusão final
                  </p>
                  <p className="mt-2 whitespace-pre-line">
                    {opinion?.finalOpinion?.trim() ||
                      "Nenhuma conclusão final personalizada foi registrada. O resumo automático do sistema foi utilizado para consolidar esta auditoria."}
                  </p>
                </div>
              </div>
            </Section>

            <Section title="Encaminhamento e aprovação">
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Encaminhamento recomendado
                  </p>
                  <div className="mt-3 space-y-3 text-sm leading-7 text-slate-700">
                    <p>
                      Este documento pode ser encaminhado para a empresa auditada
                      como registro formal da auditoria concluída, acompanhado dos
                      planos de acao e prazos definidos.
                    </p>
                    <p>
                      Recomenda-se manter esta versão em PDF anexada ao processo
                      interno da organização auditora para fins de histórico,
                      rastreabilidade e futuras verificações.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Assinaturas e ciência
                  </p>
                  <div className="mt-8 grid gap-8 sm:grid-cols-2">
                    <div>
                      <div className="h-16 border-b border-slate-400" />
                      <p className="mt-3 text-sm font-medium text-slate-900">
                        {auditReportUserName(opinion?.responsible ?? audit.assignedTo)}
                      </p>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                        Responsável técnico
                      </p>
                    </div>
                    <div>
                      <div className="h-16 border-b border-slate-400" />
                      <p className="mt-3 text-sm font-medium text-slate-900">
                        Empresa auditada
                      </p>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                        Ciência / recebimento
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Não conformidades">
              {nonConformities.length > 0 ? (
                <div className="grid gap-4">
                  {nonConformities.map((item) => (
                    <div
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                      key={item.title}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-base font-semibold text-slate-900">
                          {item.title}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs font-medium">
                          <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-red-700">
                            {item.severity}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">
                            {item.status}
                          </span>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-slate-700">
                        Prazo: {formatAuditReportDate(item.correctionDeadline)} ·
                        Planos vinculados: {item._count.actionPlans}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600">
                  Nenhuma não conformidade foi registrada nesta auditoria.
                </p>
              )}
            </Section>

            <Section title="Planos de ação">
              {actionPlans.length > 0 ? (
                <div className="grid gap-4">
                  {actionPlans.map((plan) => (
                    <div
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                      key={`${plan.title}-${plan.nonConformity.title}`}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-base font-semibold text-slate-900">
                          {plan.title}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs font-medium">
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">
                            {plan.status}
                          </span>
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                            {plan.priority}
                          </span>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-slate-700">
                        Origem: {plan.nonConformity.title} · Gravidade:{" "}
                        {plan.nonConformity.severity} · Prazo:{" "}
                        {formatAuditReportDate(plan.dueDate)}
                      </p>
                      {plan.isOverdue && plan.overdueDays ? (
                        <p className="mt-2 text-sm font-medium text-red-700">
                          Atrasado ha {plan.overdueDays} dia(s).
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600">
                  Nenhum plano de ação foi registrado nesta auditoria.
                </p>
              )}
            </Section>

            <Section title="Checklists e respostas">
              <div className="space-y-5">
                {appliedChecklists.length > 0 ? (
                  appliedChecklists.map((checklist) => (
                    <div
                      className="rounded-2xl border border-slate-200"
                      key={checklist.id}
                    >
                      <div className="border-b border-slate-200 bg-slate-50 px-4 py-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-base font-semibold text-slate-900">
                              {checklist.checklistName}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              Categoria: {checklist.checklistCategory ?? "Não informada"} ·
                              Status: {checklist.status}
                            </p>
                          </div>
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                            {checklist.items.length} itens
                          </span>
                        </div>
                        {checklist.auditorNote ? (
                          <p className="mt-3 text-sm text-slate-700">
                            Nota da auditora: {checklist.auditorNote}
                          </p>
                        ) : null}
                      </div>
                      <div className="divide-y divide-slate-200">
                        {checklist.items.map((item) => {
                          const response = item.responses[0];

                          return (
                            <div className="px-4 py-4" key={item.id}>
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    Item {item.order} · {item.question}
                                  </p>
                                  {item.description ? (
                                    <p className="mt-1 text-sm text-slate-600">
                                      {item.description}
                                    </p>
                                  ) : null}
                                </div>
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                                  {response?.answerBoolean === true
                                    ? "Conforme"
                                    : response?.answerBoolean === false
                                      ? "Não conforme"
                                      : "Registrado"}
                                </span>
                              </div>

                              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <p className="text-sm text-slate-700">
                                  Resposta:{" "}
                                  {response?.answerText ??
                                    response?.answerChoice ??
                                    (response?.answerNumber !== null &&
                                    response?.answerNumber !== undefined
                                      ? String(response.answerNumber)
                                      : null) ??
                                    (response?.answerDate
                                      ? formatAuditReportDate(response.answerDate)
                                      : null) ??
                                    (response?.answerBoolean === true
                                      ? "Conforme"
                                      : response?.answerBoolean === false
                                        ? "Não conforme"
                                        : "Não respondido")}
                                </p>
                                <p className="text-sm text-slate-700">
                                  Atualizado por:{" "}
                                  {response
                                    ? auditReportUserName(
                                        response.updatedBy ?? response.respondent,
                                      )
                                    : "Não informado"}
                                </p>
                                {response?.notes ? (
                                  <p className="text-sm text-slate-700 sm:col-span-2">
                                    Observação: {response.notes}
                                  </p>
                                ) : null}
                                {response?.evidence ? (
                                  <p className="text-sm text-slate-700 sm:col-span-2">
                                    Evidência: {response.evidence}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-600">
                    Nenhum checklist foi aplicado nesta auditoria.
                  </p>
                )}
              </div>
            </Section>

            <Section title="Documentos e evidências">
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Documentos vinculados
                  </p>
                  {documents.length > 0 ? (
                    <ul className="mt-3 space-y-3 text-sm text-slate-700">
                      {documents.map((document) => (
                        <li
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                          key={document.id}
                        >
                          <p className="font-medium text-slate-900">
                            {document.title}
                          </p>
                          <p className="mt-1">
                            {document.category ?? "Sem categoria"} · {document.origin}
                          </p>
                          {document.fileUrl ? (
                            <p className="mt-1 break-all text-slate-600">
                              {document.fileUrl}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-slate-600">
                      Nenhum documento geral vinculado.
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Evidências registradas
                  </p>
                  <div className="mt-3 space-y-3">
                    {evidences.actionPlanEvidences.map((item) => (
                      <div
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                        key={item.id}
                      >
                        <p className="font-medium text-slate-900">{item.title}</p>
                        <p className="mt-1">
                          {item.origin} · {item.status} · {item.actionPlan?.title ?? "Sem plano"}
                        </p>
                        {item.fileUrl ? (
                          <p className="mt-1 break-all text-slate-600">{item.fileUrl}</p>
                        ) : null}
                      </div>
                    ))}

                    {evidences.checklistItemEvidences.map((item) => (
                      <div
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                        key={item.id}
                      >
                        <p className="font-medium text-slate-900">
                          {item.auditChecklistItem.auditChecklist.checklistName}
                        </p>
                        <p className="mt-1">
                          Item {item.auditChecklistItem.order}:{" "}
                          {item.auditChecklistItem.question}
                        </p>
                        <p className="mt-1 break-all text-slate-600">
                          {item.evidence}
                        </p>
                      </div>
                    ))}

                    {totalEvidences === 0 ? (
                      <p className="text-sm text-slate-600">
                        Nenhuma evidência registrada.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Versão textual consolidada">
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-6 text-slate-700">
                {reportText}
              </pre>
            </Section>

            <footer className="rounded-[1.75rem] border border-slate-200 bg-slate-50 px-6 py-5 text-sm text-slate-600">
              <p>
                Documento gerado pelo ATLAS em{" "}
                {formatAuditReportDateTime(new Date())}. Para envio externo,
                utilize o botão <span className="font-semibold">Exportar em PDF</span>{" "}
                no topo da página e compartilhe o arquivo resultante.
              </p>
              <p className="mt-2">
                <Link
                  className="text-amber-700 underline print:no-underline"
                  href={`/audits/${auditId}`}
                >
                  Voltar para a auditoria
                </Link>
              </p>
            </footer>
          </div>
        </article>
      </main>
    </div>
  );
}
