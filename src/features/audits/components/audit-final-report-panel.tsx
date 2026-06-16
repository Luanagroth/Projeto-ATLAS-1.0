"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildAuditFinalReport, formatAuditReportDateTime, auditReportUserName } from "../lib/final-report";

import { saveAuditOpinionAction } from "../actions/audit-opinion-actions";
import { updateAuditStatusAction } from "../actions/audit-actions";
import {
  type AuditStatusValue,
} from "../schemas/audit-schema";
import {
  type AuditOpinionStatusValue,
} from "../schemas/audit-opinion-schema";
import type { AuditOpinionDetails } from "../services/audit-opinion-service";
import type { AuditOperationalOverview } from "../services/audit-service";
import type { AuditChecklistExecution } from "@/features/audit-checklists/services/audit-checklist-service";

type AuditFinalReportPanelProps = {
  auditId: string;
  audit: {
    company: {
      cnpj: string | null;
      name: string;
    };
    createdAt: Date;
    dueDate: Date | null;
    endDate: Date | null;
    startDate: Date | null;
    status: AuditStatusValue;
    title: string;
  };
  actionPlans: Array<{
    dueDate: Date | null;
    isOverdue?: boolean;
    overdueDays?: number;
    nonConformity: {
      severity: string;
      title: string;
    };
    priority: string;
    status: string;
    title: string;
  }>;
  appliedChecklists: AuditChecklistExecution;
  nonConformities: Array<{
    _count: {
      actionPlans: number;
    };
    correctionDeadline: Date | null;
    severity: string;
    status: string;
    title: string;
  }>;
  opinion: AuditOpinionDetails | null;
  overview: AuditOperationalOverview;
};

export function AuditFinalReportPanel({
  actionPlans,
  appliedChecklists,
  auditId,
  audit,
  nonConformities,
  opinion,
  overview,
}: AuditFinalReportPanelProps) {
  const router = useRouter();
  const generatedReport = useMemo(
    () =>
      buildAuditFinalReport({
        actionPlans,
        appliedChecklists,
        audit,
        nonConformities,
        opinion,
        overview,
      }),
    [actionPlans, appliedChecklists, audit, nonConformities, opinion, overview],
  );
  const [report, setReport] = useState(() => opinion?.finalOpinion?.trim() || generatedReport);
  const [usesGeneratedReport, setUsesGeneratedReport] = useState(
    () => !opinion?.finalOpinion?.trim(),
  );
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const reportValue = usesGeneratedReport ? generatedReport : report;

  async function copyReport() {
    await navigator.clipboard.writeText(reportValue);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function save(status: AuditOpinionStatusValue) {
    if (isPending) return;

    setIsPending(true);
    setError(null);
    setMessage(null);

    try {
      const result = await saveAuditOpinionAction({
        auditId,
        companyBrief: opinion?.companyBrief ?? "",
        generalCare: opinion?.generalCare ?? "",
        positivePoints: opinion?.positivePoints ?? "",
        criticalPoints: opinion?.criticalPoints ?? "",
        overallPerformance: opinion?.overallPerformance ?? "",
        identifiedRisks: opinion?.identifiedRisks ?? "",
        recommendations: opinion?.recommendations ?? "",
        finalOpinion: reportValue,
        status,
      });

      if (!result.ok) {
        setError(
          result.error ??
            Object.values(result.fieldErrors ?? {}).find(Boolean) ??
            "Revise o relatório.",
        );
        return;
      }

      setMessage(
        status === "COMPLETED"
          ? "Relatório concluído e selado."
          : "Relatório salvo como rascunho.",
      );

      if (status === "COMPLETED" && audit.status !== "COMPLETED") {
        const auditResult = await updateAuditStatusAction({
          auditId,
          status: "COMPLETED",
        });

        if (auditResult?.error) {
          setError(auditResult.error);
        }

        return;
      }

      router.refresh();
    } catch {
      setError("Não foi possível salvar o relatório.");
    } finally {
      setIsPending(false);
    }
  }

  const currentStatus: AuditOpinionStatusValue = opinion?.status ?? "DRAFT";
  const statusText =
    currentStatus === "COMPLETED" ? "Relatório selado" : "Relatório em edição";

  return (
    <section className="space-y-5">
      <div className="rounded-md border bg-background p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Status do relatorio</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {statusText}
              {opinion?.updatedAt
                ? ` | Atualizado em ${formatAuditReportDateTime(opinion.updatedAt)}`
                : ""}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Responsável: {auditReportUserName(opinion?.responsible)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-3 rounded-lg border bg-background p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold">Relatório final editável</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                O texto abaixo pode ser ajustado manualmente. Ele consolida checklist,
                observações, NCs, planos e o parecer técnico.
              </p>
            </div>
            <Button
              disabled={isPending}
              onClick={() => {
                setReport(generatedReport);
                setUsesGeneratedReport(true);
              }}
              type="button"
              variant="outline"
            >
              Gerar rascunho
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="final-report">Texto do relatório</Label>
            <Textarea
              className="min-h-[32rem] font-mono text-sm leading-6"
              disabled={isPending}
              id="final-report"
              onChange={(event) => {
                setReport(event.target.value);
                setUsesGeneratedReport(false);
              }}
              value={reportValue}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

          <div className="flex flex-wrap gap-2">
            {audit.status === "COMPLETED" ? (
              <Button asChild type="button" variant="outline">
                <Link href={`/reports/audits/${auditId}`} target="_blank">
                  Exportar / enviar
                </Link>
              </Button>
            ) : null}
            <Button disabled={isPending} onClick={copyReport} type="button" variant="outline">
              {copied ? "Copiado" : "Copiar relatório"}
            </Button>
            <Button disabled={isPending} onClick={() => save("DRAFT")} type="button" variant="outline">
              {isPending ? "Salvando..." : "Salvar rascunho"}
            </Button>
            <Button disabled={isPending} onClick={() => save("COMPLETED")} type="button">
              {currentStatus === "COMPLETED" ? "Salvar e manter selado" : "Concluir relatório"}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold">Resumo automático</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Visão rápida para a auditora revisar antes da selagem.
            </p>
            <div className="mt-4 grid gap-2 text-sm">
              <p>Checklist(s): {overview.checklistsApplied}</p>
              <p>Itens conformes: {overview.conformingItems}</p>
              <p>Itens não conformes: {overview.nonConformingItems}</p>
              <p>NCs abertas: {overview.ncsOpen}</p>
              <p>Planos em verificação: {overview.plansInVerification}</p>
              <p>Planos aguardando resposta: {overview.plansAwaitingResponse}</p>
              <p>Documentos e evidências: consulta e rastreabilidade</p>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold">Pontos de leitura</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Os itens de checklist, suas respostas e evidências entram no corpo do relatório.</li>
              <li>Notas internas e públicas das checklists também ficam resumidas no texto final.</li>
              <li>O mesmo registro pode ser editado depois da selagem, sem perder o histórico.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-800">
        {currentStatus === "COMPLETED" ? (
          <p>
            Auditoria selada. O relatório final continua editável para ajustes controlados,
            mantendo a trilha técnica da conclusão. Documentos e evidências seguem
            disponíveis para consulta, sem etapa adicional de aprovação.
          </p>
        ) : (
          <p>
            A selagem final ainda não foi concluída. Revise o texto, ajuste o que for
            necessário e conclua quando estiver pronto.
          </p>
        )}
      </div>
    </section>
  );
}
