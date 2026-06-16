import { ClipboardCheck, ListChecks } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import type {
  AuditChecklistExecution,
  AvailableChecklistTemplate,
} from "../services/audit-checklist-service";
import { ApplyChecklistForm } from "./apply-checklist-form";
import { ChecklistExecutionForm } from "./checklist-execution-form";

type AuditChecklistsPanelProps = {
  appliedChecklists: AuditChecklistExecution;
  auditId: string;
  canExecute: boolean;
  templates: AvailableChecklistTemplate[];
};

const statusLabels = {
  DRAFT: "Rascunho",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluido",
} as const;

export function AuditChecklistsPanel({
  appliedChecklists,
  auditId,
  canExecute,
  templates,
}: AuditChecklistsPanelProps) {
  const createHref = `/checklists/new?returnTo=/audits/${auditId}`;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-md bg-muted">
            <ListChecks className="size-5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Checklists da auditoria</h2>
            <p className="text-sm text-muted-foreground">
              Aplique um modelo existente ou crie um novo modelo reutilizavel.
            </p>
          </div>
        </div>
        {canExecute ? (
          <Button asChild size="sm" variant="outline">
            <Link href={createHref}>Criar novo modelo</Link>
          </Button>
        ) : null}
      </div>

      {canExecute && templates.length > 0 ? (
        <ApplyChecklistForm auditId={auditId} templates={templates} />
      ) : null}

      {canExecute && templates.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-5">
          <p className="text-sm font-medium">
            Nenhum modelo ativo disponivel.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie um modelo de checklist para depois aplica-lo nesta auditoria.
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link href={createHref}>Criar novo modelo</Link>
          </Button>
        </div>
      ) : null}

      {appliedChecklists.length > 0 ? (
        <div className="space-y-5">
          {appliedChecklists.map((checklist) => (
            <article className="rounded-lg border bg-card p-5" key={checklist.id}>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold">
                    {checklist.checklistName}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {checklist.checklistCategory ?? "Sem categoria"} -{" "}
                    {checklist.items.length} itens
                  </p>
                </div>
                <span className="w-fit rounded-md border bg-background px-2 py-1 text-xs font-medium text-muted-foreground">
                  {statusLabels[checklist.status]}
                </span>
              </div>
              <ChecklistExecutionForm
                auditId={auditId}
                canRespond={canExecute}
                checklist={checklist}
              />
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-card p-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-md bg-muted">
            <ClipboardCheck className="size-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">
            Nenhum checklist aplicado
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Aplique um modelo existente ou crie um novo modelo para iniciar a
            execucao da auditoria.
          </p>
        </div>
      )}
    </section>
  );
}
