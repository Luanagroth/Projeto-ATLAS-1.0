import { History } from "lucide-react";

import type { AuditHistoryItem } from "../services/audit-service";

type AuditHistoryPanelProps = {
  items: AuditHistoryItem[];
};

const actionLabels: Record<string, string> = {
  CREATED: "Auditoria criada",
  STATUS_CHANGED: "Status alterado",
  CHECKLIST_APPLIED: "Checklist aplicado",
  NC_CREATED: "NC registrada",
  ACTION_PLAN_CREATED: "Plano de acao criado",
  UPDATED: "Auditoria atualizada",
};

function parseChanges(changes: string | null): string | null {
  if (!changes) return null;

  try {
    const parsed = JSON.parse(changes) as Record<string, unknown>;

    if (parsed.from && parsed.to) {
      const statusMap: Record<string, string> = {
        DRAFT: "Rascunho",
        IN_PROGRESS: "Em andamento",
        COMPLETED: "Concluida",
        CANCELLED: "Cancelada",
      };

      const from = statusMap[String(parsed.from)] ?? String(parsed.from);
      const to = statusMap[String(parsed.to)] ?? String(parsed.to);

      return `${from} -> ${to}`;
    }

    if (parsed.title) return String(parsed.title);

    return null;
  } catch {
    return null;
  }
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function AuditHistoryPanel({ items }: AuditHistoryPanelProps) {
  return (
    <section className="space-y-4">
      {items.length > 0 ? (
        <ol className="space-y-3">
          {items.map((item) => {
            const label = actionLabels[item.action] ?? item.action;
            const detail = parseChanges(item.changes);

            return (
              <li className="flex items-start gap-3 text-sm" key={item.id}>
                <div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full border bg-background">
                  <History className="size-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-medium">{label}</span>
                  {detail ? (
                    <span className="ml-1 text-muted-foreground">- {detail}</span>
                  ) : null}
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDateTime(item.createdAt)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nenhum evento registrado ainda.
        </p>
      )}
    </section>
  );
}
