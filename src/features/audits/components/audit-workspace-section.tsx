import { ChevronLeft, CircleCheckBig, CircleDashed, CircleDot } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AuditWorkspaceSectionProps = {
  children: ReactNode;
  count?: number;
  defaultOpen?: boolean;
  description?: string;
  id?: string;
  backHref?: string;
  backLabel?: string;
  status?: "done" | "current" | "pending" | "neutral";
  title: string;
};

export function AuditWorkspaceSection({
  children,
  backHref,
  backLabel = "Voltar",
  count,
  defaultOpen = true,
  description,
  id,
  status = "pending",
  title,
}: AuditWorkspaceSectionProps) {
  const statusClasses = {
    current: "border-blue-200 bg-blue-50/60",
    done: "border-emerald-200 bg-emerald-50/50",
    neutral: "border-border bg-muted/20",
    pending: "border-border bg-card",
  };

  return (
    <details
      className={cn("group rounded-lg border scroll-mt-24", statusClasses[status])}
      id={id}
      open={defaultOpen ? true : undefined}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">{title}</h2>
            {count !== undefined ? (
              <span className="rounded-full border bg-background px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {count}
              </span>
            ) : null}
            {status === "done" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                <CircleCheckBig className="size-3.5" />
                Concluido
              </span>
            ) : status === "current" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                <CircleDot className="size-3.5" />
                Em andamento
              </span>
            ) : status === "neutral" ? (
              <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                <CircleDashed className="size-3.5" />
                Consulta
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                <CircleDashed className="size-3.5" />
                Pendente
              </span>
            )}
          </div>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <span className="mt-0.5 text-xs font-medium text-muted-foreground">
          abrir/fechar
        </span>
      </summary>
      <div className="border-t p-5">
        <div className="mb-4 flex flex-wrap gap-2">
          {backHref ? (
            <Button asChild className="w-full sm:w-auto" size="sm" variant="outline">
              <Link href={backHref}>
                <ChevronLeft className="size-4" />
                {backLabel}
              </Link>
            </Button>
          ) : null}
        </div>
        {children}
      </div>
    </details>
  );
}
