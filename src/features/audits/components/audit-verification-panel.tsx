import { ClipboardCheck } from "lucide-react";
import Link from "next/link";

import { ActionPlanStatusBadge } from "@/features/action-plans/components/action-plan-badges";
import {
  evidenceOriginLabels,
  evidenceStatusLabels,
} from "@/features/action-plans/schemas/evidence-schema";

import type { AuditVerificationItem } from "../services/audit-service";

type AuditVerificationPanelProps = {
  auditId: string;
  items: AuditVerificationItem[];
};

function userName(user?: { email: string; name: string | null } | null) {
  return user?.name ?? user?.email ?? "Nao informado";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function AuditVerificationPanel({
  auditId,
  items,
}: AuditVerificationPanelProps) {
  return (
    <section className="space-y-3">
      {items.length > 0 ? (
        items.map((item) => (
          <Link
            className="block rounded-md border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
            href={`/action-plans/${item.id}?from=${auditId}`}
            key={item.id}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="size-4 shrink-0 text-muted-foreground" />
                  <h3 className="truncate text-sm font-semibold">
                    {item.title}
                  </h3>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  NC: {item.nonConformity.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.evidences.length} evidencia
                  {item.evidences.length !== 1 ? "s" : ""} anexada
                  {item.evidences.length !== 1 ? "s" : ""}
                </p>
              </div>
              <ActionPlanStatusBadge status={item.status} />
            </div>

            {item.evidences.length > 0 ? (
              <div className="mt-3 grid gap-2">
                {item.evidences.slice(0, 3).map((evidence) => (
                  <div
                    className="rounded-md border bg-muted/20 p-3 text-xs"
                    key={evidence.id}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{evidence.title}</span>
                      <span className="rounded border px-1.5 py-0.5">
                        {evidenceOriginLabels[evidence.origin]}
                      </span>
                      <span className="rounded border px-1.5 py-0.5">
                        {evidenceStatusLabels[evidence.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {userName(evidence.attachedBy)} -{" "}
                      {formatDate(evidence.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </Link>
        ))
      ) : (
        <p className="rounded-md border border-dashed bg-background p-4 text-sm text-muted-foreground">
          Nenhum plano aguardando verificacao ou evidencia anexada.
        </p>
      )}
    </section>
  );
}
