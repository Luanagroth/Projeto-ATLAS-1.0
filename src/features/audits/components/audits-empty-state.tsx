import { ClipboardCheck, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type AuditsEmptyStateProps = {
  canCreateAudit: boolean;
};

export function AuditsEmptyState({ canCreateAudit }: AuditsEmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed bg-card p-8 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-md bg-muted">
        <ClipboardCheck className="size-6 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">Nenhuma auditoria criada</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        As auditorias da sua organização aparecerão aqui assim que forem
        cadastradas.
      </p>
      {canCreateAudit ? (
        <Button asChild className="mt-5">
          <Link href="/audits/new">
            <Plus />
            Nova auditoria
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
