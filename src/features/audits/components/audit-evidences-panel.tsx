import { ExternalLink, FileText, FolderUp } from "lucide-react";
import Link from "next/link";

import {
  evidenceOriginLabels,
  evidenceStatusLabels,
} from "@/features/action-plans/schemas/evidence-schema";

import type { AuditEvidenceItems } from "../services/audit-service";

type AuditEvidencesPanelProps = {
  auditId: string;
  items: AuditEvidenceItems;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function userName(user?: { email: string; name: string | null } | null) {
  return user?.name ?? user?.email ?? "Nao informado";
}

export function AuditEvidencesPanel({ auditId, items }: AuditEvidencesPanelProps) {
  const total =
    items.actionPlanEvidences.length + items.checklistItemEvidences.length;

  if (total === 0) {
    return (
      <p className="rounded-md border border-dashed bg-background p-4 text-sm text-muted-foreground">
        Nenhuma evidencia anexada nesta auditoria.
      </p>
    );
  }

  return (
    <section className="space-y-4">
      {items.actionPlanEvidences.length > 0 ? (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Evidencias dos planos de acao</h3>
            <p className="text-xs text-muted-foreground">
              Evidencias formais vinculadas a plano de acao e revisao.
            </p>
          </div>
          {items.actionPlanEvidences.map((item) => (
            <div className="rounded-md border bg-background p-4" key={item.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <FileText className="size-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                    <span className="rounded border px-1.5 py-0.5 text-xs">
                      {evidenceOriginLabels[item.origin]}
                    </span>
                    <span className="rounded border px-1.5 py-0.5 text-xs">
                      {evidenceStatusLabels[item.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {userName(item.attachedBy)} | {formatDate(item.createdAt)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Plano:{" "}
                    <Link
                      className="font-medium text-primary hover:underline"
                      href={`/action-plans/${item.actionPlan.id}?from=${auditId}`}
                    >
                      {item.actionPlan.title}
                    </Link>
                    {item.nonConformity ? ` | NC: ${item.nonConformity.title}` : ""}
                  </p>
                </div>
                {item.fileUrl ? (
                  <a
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    href={item.fileUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Abrir arquivo/link
                    <ExternalLink className="size-3" />
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {items.checklistItemEvidences.length > 0 ? (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Anexos dos itens do checklist</h3>
            <p className="text-xs text-muted-foreground">
              Evidencias anexadas diretamente durante o preenchimento do checklist.
            </p>
          </div>
          {items.checklistItemEvidences.map((item) => (
            <div className="rounded-md border bg-background p-4" key={item.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <FolderUp className="size-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">
                      {item.auditChecklistItem.auditChecklist.checklistName} - item{" "}
                      {item.auditChecklistItem.order}
                    </h3>
                    <span className="rounded border px-1.5 py-0.5 text-xs">
                      Checklist
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.auditChecklistItem.question}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {userName(item.updatedBy ?? item.respondent)} |{" "}
                    {formatDate(item.updatedAt)}
                  </p>
                  {item.notes ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Observacao: {item.notes}
                    </p>
                  ) : null}
                </div>
                {item.evidence ? (
                  <a
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    href={item.evidence}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Abrir anexo
                    <ExternalLink className="size-3" />
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
