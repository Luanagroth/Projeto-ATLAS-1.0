import { CalendarDays, ClipboardCheck } from "lucide-react";
import Link from "next/link";

import { statusLabels } from "../schemas/non-conformity-schema";
import type { NonConformityListItem } from "../services/non-conformity-service";
import { SeverityBadge } from "./severity-badge";

type NonConformitiesListProps = {
  items: NonConformityListItem[];
};

function formatDate(date?: Date | null) {
  if (!date) {
    return "Sem prazo";
  }

  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
}

export function NonConformitiesList({ items }: NonConformitiesListProps) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <Link
          className="group rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-[color:rgba(245,158,11,0.24)] hover:bg-card"
          href={`/non-conformities/${item.id}`}
          key={item.id}
        >
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-50">
              <ClipboardCheck className="size-5 text-slate-700" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold group-hover:text-primary">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.audit.company.name} • {item.audit.title}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <SeverityBadge severity={item.severity} />
                  <span className="w-fit rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {statusLabels[item.status]}
                  </span>
                </div>
              </div>
              <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                <CalendarDays className="size-4" />
                Prazo: {formatDate(item.correctionDeadline)}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
