import { CalendarDays, ListChecks, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import type { NonConformityActionPlanItem } from "../services/action-plan-service";
import {
  ActionPlanPriorityBadge,
  ActionPlanStatusBadge,
} from "./action-plan-badges";

type NonConformityActionPlansPanelProps = {
  canCreate: boolean;
  items: NonConformityActionPlanItem[];
  nonConformityId: string;
};

function formatDate(date?: Date | null) {
  return date
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date)
    : "Sem prazo";
}

function userName(user?: { email: string; name: string | null } | null) {
  return user?.name ?? user?.email ?? "Sem responsavel";
}

export function NonConformityActionPlansPanel({
  canCreate,
  items,
  nonConformityId,
}: NonConformityActionPlansPanelProps) {
  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ListChecks className="size-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">Planos de ação</h2>
        </div>
        {canCreate ? (
          <Button asChild size="sm">
            <Link href={`/non-conformities/${nonConformityId}/action-plans/new`}>
              <Plus />
              Criar plano
            </Link>
          </Button>
        ) : null}
      </div>

      {items.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {items.map((item) => (
            <Link
              className="rounded-md border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
              href={`/action-plans/${item.id}`}
              key={item.id}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Responsavel: {userName(item.responsible)}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                    <CalendarDays className="size-4" />
                    Prazo: {formatDate(item.dueDate)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ActionPlanPriorityBadge priority={item.priority} />
                  <ActionPlanStatusBadge status={item.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-md border border-dashed bg-background p-4 text-sm text-muted-foreground">
          Nenhum plano de ação vinculado a esta não conformidade.
        </p>
      )}
    </section>
  );
}
