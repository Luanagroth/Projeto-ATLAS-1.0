import { CalendarDays, ListChecks } from "lucide-react";
import Link from "next/link";

import type { ChecklistListItem } from "../services/checklist-service";

type ChecklistsListProps = {
  checklists: ChecklistListItem[];
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(date);
}

export function ChecklistsList({ checklists }: ChecklistsListProps) {
  return (
    <div className="grid gap-3">
      {checklists.map((checklist) => (
        <Link
          className="group rounded-lg border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/30"
          href={`/checklists/${checklist.id}`}
          key={checklist.id}
        >
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
              <ListChecks className="size-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold group-hover:text-primary">
                    {checklist.name}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {checklist.category ?? "Sem categoria"} •{" "}
                    {checklist._count.items} itens
                  </p>
                </div>
                <span className="w-fit rounded-md border bg-background px-2 py-1 text-xs font-medium text-muted-foreground">
                  {checklist.isActive ? "Ativo" : "Inativo"}
                </span>
              </div>
              <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                <CalendarDays className="size-4" />
                Criado em {formatDate(checklist.createdAt)}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
