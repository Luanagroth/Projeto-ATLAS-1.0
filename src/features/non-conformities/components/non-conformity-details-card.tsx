import { CalendarDays, ClipboardCheck, TriangleAlert, UserRound } from "lucide-react";

import { statusLabels } from "../schemas/non-conformity-schema";
import type { NonConformityDetails } from "../services/non-conformity-service";
import { SeverityBadge } from "./severity-badge";

type NonConformityDetailsCardProps = {
  item: NonConformityDetails;
};

function formatDate(date?: Date | null) {
  return date
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date)
    : "Não informado";
}

function userName(user?: { email: string; name: string | null } | null) {
  return user?.name ?? user?.email ?? "Não informado";
}

export function NonConformityDetailsCard({ item }: NonConformityDetailsCardProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <TriangleAlert className="size-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">Dados da não conformidade</h2>
        </div>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border bg-background p-4">
            <dt className="text-sm font-medium text-muted-foreground">Criticidade</dt>
            <dd className="mt-2"><SeverityBadge severity={item.severity} /></dd>
          </div>
          <div className="rounded-md border bg-background p-4">
            <dt className="text-sm font-medium text-muted-foreground">Status</dt>
            <dd className="mt-1 text-sm">{statusLabels[item.status]}</dd>
          </div>
          <div className="rounded-md border bg-background p-4 sm:col-span-2">
            <dt className="text-sm font-medium text-muted-foreground">Descrição</dt>
            <dd className="mt-1 text-sm leading-6">{item.description}</dd>
          </div>
          <div className="rounded-md border bg-background p-4 sm:col-span-2">
            <dt className="text-sm font-medium text-muted-foreground">Observacoes</dt>
            <dd className="mt-1 text-sm leading-6">{item.correctionNotes ?? "Nenhuma observação."}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">Origem</h2>
        </div>
        <dl className="mt-4 space-y-4 text-sm">
          <div>
            <dt className="font-medium text-muted-foreground">Empresa</dt>
            <dd className="mt-1">{item.audit.company.name}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Auditoria</dt>
            <dd className="mt-1">{item.audit.title}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Item do checklist</dt>
            <dd className="mt-1">
              {item.auditChecklistItem
                ? `${item.auditChecklistItem.auditChecklist.checklistName} - ${item.auditChecklistItem.question}`
                : "Não vinculado"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <UserRound className="size-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">Pessoas</h2>
        </div>
        <dl className="mt-4 space-y-4 text-sm">
          <div>
            <dt className="font-medium text-muted-foreground">Criada por</dt>
            <dd className="mt-1">{userName(item.createdBy)}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Responsavel</dt>
            <dd className="mt-1">{userName(item.responsible)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">Datas</h2>
        </div>
        <dl className="mt-4 space-y-4 text-sm">
          <div><dt className="font-medium text-muted-foreground">Prazo</dt><dd className="mt-1">{formatDate(item.correctionDeadline)}</dd></div>
          <div><dt className="font-medium text-muted-foreground">Resolvida em</dt><dd className="mt-1">{formatDate(item.resolvedAt)}</dd></div>
          <div><dt className="font-medium text-muted-foreground">Criada em</dt><dd className="mt-1">{formatDate(item.createdAt)}</dd></div>
        </dl>
      </section>
    </div>
  );
}
