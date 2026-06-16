import { AlertCircle, CalendarDays, FileText, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  ActionPlanPriorityBadge,
  ActionPlanStatusBadge,
} from "@/features/action-plans/components/action-plan-badges";

import type { AuditActionPlanItem } from "../services/audit-service";

type AuditActionPlansPanelProps = {
  auditId: string;
  canCreate: boolean;
  items: AuditActionPlanItem[];
};

function formatDate(date?: Date | null) {
  if (!date) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(date);
}

function userName(user?: { email: string; name: string | null } | null) {
  return user?.name ?? user?.email ?? "Nao atribuido";
}

export function AuditActionPlansPanel({
  auditId,
  canCreate,
  items,
}: AuditActionPlansPanelProps) {
  const overdueItems = items.filter((i) => i.isOverdue);
  const activeItems = items.filter((i) => !i.isOverdue);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            Passo 3. Plano nasce de NC
          </p>
          <p className="text-sm text-muted-foreground">
            Depois da NC formalizada, crie aqui o plano que sera respondido
            pela empresa. O sistema permite mais de um plano por NC, mas o
            ideal e consolidar quando a tratativa for a mesma.
          </p>
          {overdueItems.length > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
              <AlertCircle className="size-3" />
              {overdueItems.length} atrasado
              {overdueItems.length !== 1 ? "s" : ""}
            </span>
          ) : null}
        </div>
        {canCreate ? (
          <Button asChild className="w-full sm:w-auto" size="sm">
            <Link href={`/audits/${auditId}/action-plans/new`}>
              <Plus className="size-4" />
              Novo plano
            </Link>
          </Button>
        ) : null}
      </div>

      {items.length > 0 ? (
        <div className="space-y-3">
          {overdueItems.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                Prazo vencido
              </p>
              {overdueItems.map((item) => (
                <PlanCard auditId={auditId} key={item.id} item={item} />
              ))}
            </div>
          ) : null}

          {activeItems.length > 0 ? (
            <div className="space-y-2">
              {overdueItems.length > 0 ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Em andamento / pendentes
                </p>
              ) : null}
              {activeItems.map((item) => (
                <PlanCard auditId={auditId} key={item.id} item={item} />
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed bg-background p-4 text-sm text-muted-foreground">
          Nenhum plano de acao registrado nesta auditoria. Quando a NC estiver
          pronta, este sera o proximo passo do fluxo.
        </p>
      )}
    </section>
  );
}

function PlanCard({ auditId, item }: { auditId: string; item: AuditActionPlanItem }) {
  return (
    <Link
      className={`block rounded-xl border bg-background p-4 transition-colors hover:border-[color:rgba(245,158,11,0.24)] hover:bg-card ${
        item.isOverdue ? "border-red-200 bg-red-50/40" : ""
      }`}
      href={`/action-plans/${item.id}?from=${auditId}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <FileText className="size-4 shrink-0 text-muted-foreground" />
            <h3 className="truncate text-sm font-semibold">{item.title}</h3>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            NC: {item.nonConformity.title}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Responsavel: {userName(item.responsible)}
          </p>
          <p
            className={`mt-1 flex items-center gap-1 text-xs ${
              item.isOverdue ? "font-semibold text-red-600" : "text-muted-foreground"
            }`}
          >
            <CalendarDays className="size-3 shrink-0" />
            Prazo: {formatDate(item.dueDate)}
            {item.isOverdue && item.overdueDays > 0 ? (
              <span className="ml-1 rounded bg-red-100 px-1 py-0.5 text-[10px] font-bold text-red-700">
                {item.overdueDays}d em atraso
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <ActionPlanPriorityBadge priority={item.priority} />
          <ActionPlanStatusBadge status={item.status} />
        </div>
      </div>
    </Link>
  );
}
