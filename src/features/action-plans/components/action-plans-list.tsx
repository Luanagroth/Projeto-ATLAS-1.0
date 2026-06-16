import { CalendarDays, ListChecks, UserRound } from "lucide-react";
import Link from "next/link";

import type { ActionPlanListItem } from "../services/action-plan-service";
import {
  ActionPlanPriorityBadge,
  ActionPlanStatusBadge,
} from "./action-plan-badges";

type ActionPlansListProps = {
  items: ActionPlanListItem[];
};

function formatDate(date?: Date | null) {
  if (!date) {
    return "Sem prazo";
  }

  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
}

function userName(user?: { email: string; name: string | null } | null) {
  return user?.name ?? user?.email ?? "Sem responsavel";
}

export function ActionPlansList({ items }: ActionPlansListProps) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <Link
          className="group rounded-xl border bg-card/95 p-4 shadow-sm ring-1 ring-black/2 transition-all hover:-translate-y-0.5 hover:border-[color:rgba(194,124,58,0.28)] hover:bg-card"
          href={`/action-plans/${item.id}`}
          key={item.id}
        >
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[color:rgba(194,124,58,0.12)] text-[color:var(--atlas-accent)]">
              <ListChecks className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold group-hover:text-primary">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.nonConformity.audit.company.name} -{" "}
                    {item.nonConformity.title}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ActionPlanPriorityBadge priority={item.priority} />
                  <ActionPlanStatusBadge status={item.status} />
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-5">
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-4" />
                  Prazo: {formatDate(item.dueDate)}
                </span>
                <span className="flex items-center gap-1">
                  <UserRound className="size-4" />
                  {userName(item.responsible)}
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
