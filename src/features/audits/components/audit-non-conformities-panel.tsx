import { CalendarDays, ListChecks, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { severityLabels } from "@/features/non-conformities/schemas/non-conformity-schema";

import type { AuditNonConformityItem } from "../services/audit-service";

type AuditNonConformitiesPanelProps = {
  auditId: string;
  canCreate: boolean;
  items: AuditNonConformityItem[];
};

const statusLabels = {
  OPEN: "Aberta",
  IN_PROGRESS: "Em andamento",
  RESOLVED: "Resolvida",
} as const;

const statusColors = {
  OPEN: "text-amber-700 border-amber-500/40 bg-amber-500/10",
  IN_PROGRESS: "text-blue-700 border-blue-500/40 bg-blue-500/10",
  RESOLVED: "text-emerald-700 border-emerald-500/40 bg-emerald-500/10",
} as const;

function formatDate(date?: Date | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(date);
}

export function AuditNonConformitiesPanel({
  auditId,
  canCreate,
  items,
}: AuditNonConformitiesPanelProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Passo 2. Formalize somente depois de revisar. Hoje o sistema permite
          mais de uma NC para o mesmo item, entao evite duplicidade
          manualmente.
        </p>
        {canCreate ? (
          <Button asChild className="w-full sm:w-auto" size="sm">
            <Link href={`/audits/${auditId}/non-conformities/new`}>
              <Plus className="size-4" />
              Registrar NC manual
            </Link>
          </Button>
        ) : null}
      </div>

      {items.length > 0 ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <Link
              className="rounded-md border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
              href={`/non-conformities/${item.id}?from=${auditId}`}
              key={item.id}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">{item.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Responsavel:{" "}
                    {item.responsible?.name ??
                      item.responsible?.email ??
                      "Nao atribuido"}
                  </p>
                  {item.correctionDeadline ? (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="size-3" />
                      Prazo: {formatDate(item.correctionDeadline)}
                    </p>
                  ) : null}
                  {item._count.actionPlans > 0 ? (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <ListChecks className="size-3" />
                      {item._count.actionPlans} plano
                      {item._count.actionPlans !== 1 ? "s" : ""} de acao
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <span className="rounded-md border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {severityLabels[item.severity]}
                  </span>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-xs font-medium ${statusColors[item.status]}`}
                  >
                    {statusLabels[item.status]}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-dashed bg-background p-4 text-sm text-muted-foreground">
          Nenhuma NC registrada nesta auditoria.
        </p>
      )}
    </section>
  );
}
