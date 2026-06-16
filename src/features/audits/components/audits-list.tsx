import { Building2, CalendarDays, ClipboardCheck } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

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
        <div
          className="rounded-xl border bg-card/95 p-4 shadow-sm ring-1 ring-black/2 transition-all hover:-translate-y-0.5 hover:border-[color:rgba(194,124,58,0.28)] hover:bg-card"
          key={audit.id}
        >
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[color:rgba(194,124,58,0.12)] text-[color:var(--atlas-accent)]">
              <ClipboardCheck className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <Link href={`/audits/${audit.id}`}>
                    <h2 className="truncate text-base font-semibold hover:text-primary">
                      {audit.title}
                    </h2>
                  </Link>
                  <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                    <Building2 className="size-4" />
                    {audit.company.name}
                  </p>
                  {audit.company.cnpj ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      CNPJ {audit.company.cnpj}
                    </p>
                  ) : null}
                </div>
                <span className="w-fit rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {auditStatusLabels[audit.status]}
                </span>
              </div>
              <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                <CalendarDays className="size-4" />
                Criada em {formatDate(audit.createdAt)}
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button asChild className="w-full sm:w-auto" size="sm" variant="outline">
                  <Link href={`/audits/${audit.id}`}>Abrir auditoria</Link>
                </Button>
                {audit.status === "COMPLETED" ? (
                  <Button asChild className="w-full sm:w-auto" size="sm">
                    <Link href={`/reports/audits/${audit.id}`} target="_blank">
                      Exportar / enviar
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
