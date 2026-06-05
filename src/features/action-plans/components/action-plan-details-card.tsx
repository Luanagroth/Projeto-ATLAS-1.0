import {
  CalendarDays,
  ClipboardCheck,
  FileText,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import type { ActionPlanDetails } from "../services/action-plan-service";
import {
  ActionPlanPriorityBadge,
  ActionPlanStatusBadge,
} from "./action-plan-badges";

type ActionPlanDetailsCardProps = {
  item: ActionPlanDetails;
};

function formatDate(date?: Date | null) {
  return date
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date)
    : "Não informado";
}

function userName(user?: { email: string; name: string | null } | null) {
  return user?.name ?? user?.email ?? "Não informado";
}

export function ActionPlanDetailsCard({ item }: ActionPlanDetailsCardProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">Dados do plano</h2>
        </div>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border bg-background p-4">
            <dt className="text-sm font-medium text-muted-foreground">Prioridade</dt>
            <dd className="mt-2">
              <ActionPlanPriorityBadge priority={item.priority} />
            </dd>
          </div>
          <div className="rounded-md border bg-background p-4">
            <dt className="text-sm font-medium text-muted-foreground">Status</dt>
            <dd className="mt-2">
              <ActionPlanStatusBadge status={item.status} />
            </dd>
          </div>
          <div className="rounded-md border bg-background p-4 sm:col-span-2">
            <dt className="text-sm font-medium text-muted-foreground">Descrição</dt>
            <dd className="mt-1 text-sm leading-6">
              {item.description ?? "Nenhuma descricao."}
            </dd>
          </div>
          <div className="rounded-md border bg-background p-4 sm:col-span-2">
            <dt className="text-sm font-medium text-muted-foreground">Observacoes</dt>
            <dd className="mt-1 text-sm leading-6">
              {item.notes ?? "Nenhuma observação."}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <TriangleAlert className="size-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">Não conformidade vinculada</h2>
        </div>
        <dl className="mt-4 space-y-4 text-sm">
          <div>
            <dt className="font-medium text-muted-foreground">Empresa</dt>
            <dd className="mt-1">{item.nonConformity.audit.company.name}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Auditoria</dt>
            <dd className="mt-1">{item.nonConformity.audit.title}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Não conformidade</dt>
            <dd className="mt-1">
              <Link
                className="font-medium text-primary hover:underline"
                href={`/non-conformities/${item.nonConformity.id}`}
              >
                {item.nonConformity.title}
              </Link>
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
            <dt className="font-medium text-muted-foreground">Criado por</dt>
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
          <div>
            <dt className="font-medium text-muted-foreground">Prazo</dt>
            <dd className="mt-1">{formatDate(item.dueDate)}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Concluido em</dt>
            <dd className="mt-1">{formatDate(item.completedAt)}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Criado em</dt>
            <dd className="mt-1">{formatDate(item.createdAt)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm xl:col-span-2">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">Evidencias futuras</h2>
        </div>
        <p className="mt-4 rounded-md border border-dashed bg-background p-4 text-sm text-muted-foreground">
          Anexos, comentários e evidências de execução serão adicionados em uma etapa futura.
        </p>
      </section>
    </div>
  );
}
