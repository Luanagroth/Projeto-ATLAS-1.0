import { ListChecks, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type ChecklistsEmptyStateProps = {
  canCreateChecklist: boolean;
};

export function ChecklistsEmptyState({
  canCreateChecklist,
}: ChecklistsEmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed bg-card p-8 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-md bg-muted">
        <ListChecks className="size-6 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">
        Nenhum modelo de checklist criado
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Templates reutilizáveis aparecerão aqui e poderão ser aplicados dentro
        das auditorias.
      </p>
      {canCreateChecklist ? (
        <Button asChild className="mt-5">
          <Link href="/checklists/new">
            <Plus />
            Novo modelo de checklist
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
