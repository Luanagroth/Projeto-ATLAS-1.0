import { CalendarDays, ExternalLink, FileText, History } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  auditStatusLabels,
} from "@/features/audits/schemas/audit-schema";
import {
  evidenceOriginLabels,
  evidenceStatusLabels,
} from "@/features/action-plans/schemas/evidence-schema";

import type {
  CompanyAuditItem,
  CompanyEvidenceItem,
  CompanyHistoryItem,
} from "../services/company-service";

type CompanyDossierPanelsProps = {
  audits: CompanyAuditItem[];
  canCreateAudit: boolean;
  companyId: string;
  evidences: CompanyEvidenceItem[];
  history: CompanyHistoryItem[];
};

function formatDate(date?: Date | null) {
  return date
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(date)
    : "Nao informado";
}

function userName(user?: { email: string; name: string | null } | null) {
  return user?.name ?? user?.email ?? "Nao informado";
}

export function CompanyDossierPanels({
  audits,
  canCreateAudit,
  companyId,
  evidences,
  history,
}: CompanyDossierPanelsProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-lg border bg-card p-5 shadow-sm lg:col-span-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-5 text-muted-foreground" />
            <h2 className="text-base font-semibold">Auditorias vinculadas</h2>
          </div>
          {canCreateAudit ? (
            <Button asChild className="w-full sm:w-auto" size="sm">
              <Link href={`/audits/new?companyId=${companyId}`}>Nova auditoria</Link>
            </Button>
          ) : null}
        </div>

        {audits.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {audits.map((audit) => (
              <Link
                className="rounded-md border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
                href={`/audits/${audit.id}`}
                key={audit.id}
              >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 className="text-sm font-semibold">{audit.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Criada em {formatDate(audit.createdAt)} | Prazo{" "}
                      {formatDate(audit.dueDate)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {audit._count.appliedChecklists} checklist
                      {audit._count.appliedChecklists !== 1 ? "s" : ""} |{" "}
                      {audit._count.nonConformities} NC
                      {audit._count.nonConformities !== 1 ? "s" : ""}
                    </p>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">
                      Status da auditoria: {auditStatusLabels[audit.status]}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-md border border-dashed bg-background p-4 text-sm text-muted-foreground">
            Nenhuma auditoria vinculada a esta empresa.
          </p>
        )}
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">Documentos e evidencias</h2>
        </div>
        {evidences.length > 0 ? (
          <div className="mt-4 space-y-3">
            {evidences.map((evidence) => (
              <div className="rounded-md border bg-background p-3" key={evidence.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{evidence.title}</p>
                  <span className="rounded border px-1.5 py-0.5 text-xs">
                    {evidenceOriginLabels[evidence.origin]}
                  </span>
                  <span className="rounded border px-1.5 py-0.5 text-xs">
                    {evidenceStatusLabels[evidence.status]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {evidence.audit.title} | {userName(evidence.attachedBy)} |{" "}
                  {formatDate(evidence.createdAt)}
                </p>
                {evidence.fileUrl ? (
                  <a
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    href={evidence.fileUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Abrir arquivo/link
                    <ExternalLink className="size-3" />
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-md border border-dashed bg-background p-4 text-sm text-muted-foreground">
            Nenhum documento ou evidencia anexado nas auditorias desta empresa.
          </p>
        )}
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <History className="size-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">Historico basico</h2>
        </div>
        {history.length > 0 ? (
          <div className="mt-4 space-y-3">
            {history.map((item) => (
              <div className="rounded-md border bg-background p-3 text-sm" key={item.id}>
                <p className="font-medium">
                  {item.entity} - {item.action}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.audit?.title ?? "Auditoria"} | {formatDate(item.createdAt)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-md border border-dashed bg-background p-4 text-sm text-muted-foreground">
            Nenhum evento registrado ainda.
          </p>
        )}
      </section>
    </div>
  );
}
