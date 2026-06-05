import { Building2, CalendarDays, ClipboardCheck } from "lucide-react";
import Link from "next/link";

import { auditStatusLabels } from "../schemas/audit-schema";
import type { AuditListItem } from "../services/audit-service";

type AuditsListProps = {
  audits: AuditListItem[];
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(date);
}

export function AuditsList({ audits }: AuditsListProps) {
  return (
    <div className="grid gap-3">
      {audits.map((audit) => (
        <Link
          className="group rounded-lg border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/30"
          href={`/audits/${audit.id}`}
          key={audit.id}
        >
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
              <ClipboardCheck className="size-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold group-hover:text-primary">
                    {audit.title}
                  </h2>
                  <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                    <Building2 className="size-4" />
                    {audit.company.name}
                  </p>
                </div>
                <span className="w-fit rounded-md border bg-background px-2 py-1 text-xs font-medium text-muted-foreground">
                  {auditStatusLabels[audit.status]}
                </span>
              </div>
              <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                <CalendarDays className="size-4" />
                Criada em {formatDate(audit.createdAt)}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
