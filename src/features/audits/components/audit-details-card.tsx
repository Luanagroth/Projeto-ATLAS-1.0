import {
  Building2,
  CalendarDays,
  ClipboardCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import {
  auditStatusLabels,
  isAuditEditable,
  type AuditStatusValue,
} from "../schemas/audit-schema";
import type { AuditDetails } from "../services/audit-service";
import { AuditStatusActions } from "./audit-status-actions";

type AuditDetailsCardProps = {
  audit: AuditDetails;
  canChangeStatus: boolean;
};

type DetailItem = {
  label: string;
  value?: Date | string | null;
};

function formatDate(value?: Date | string | null) {
  if (!value) return "Não informado";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
}

function formatText(value?: string | null) {
  return value?.trim() || "Não informado";
}

function DetailCard({
  children,
  icon: Icon,
  title,
}: {
  children: ReactNode;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <section className="rounded-xl border bg-card/96 p-5 shadow-sm ring-1 ring-black/2">
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-[color:rgba(194,124,58,0.12)] text-[color:var(--atlas-accent)]">
          <Icon className="size-4" />
        </div>
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DetailList({ items }: { items: DetailItem[] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div className="rounded-xl border bg-background/92 p-4" key={item.label}>
          <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {item.label}
          </dt>
          <dd className="mt-1 text-sm leading-6">
            {item.value instanceof Date
              ? formatDate(item.value)
              : formatText(item.value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

const statusColors: Record<AuditStatusValue, string> = {
  DRAFT: "border-slate-500/20 bg-slate-500/8 text-slate-700",
  IN_PROGRESS: "border-blue-500/20 bg-blue-500/8 text-blue-700",
  COMPLETED: "border-emerald-500/20 bg-emerald-500/8 text-emerald-700",
  CANCELLED: "border-red-500/20 bg-red-500/8 text-red-700",
};

export function AuditDetailsCard({
  audit,
  canChangeStatus,
}: AuditDetailsCardProps) {
  const createdBy = audit.createdBy?.name ?? audit.createdBy?.email ?? "Não informado";
  const assignedTo = audit.assignedTo?.name ?? audit.assignedTo?.email ?? "Não atribuído";
  const status = audit.status as AuditStatusValue;
  const editable = isAuditEditable(status);

  return (
    <details className="group rounded-xl border bg-card/96 shadow-sm ring-1 ring-black/2">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5">
        <div>
          <h2 className="text-base font-semibold">
            Dados da auditoria, empresa e responsáveis
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bloco minimizado para consulta de dados cadastrais, datas e pessoas.
          </p>
        </div>
        <span className="mt-0.5 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          abrir/fechar
        </span>
      </summary>

      <div className="space-y-4 border-t p-5">
        <div className="flex flex-col gap-3 rounded-xl border bg-background/92 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full border px-3 py-1 text-sm font-semibold ${statusColors[status]}`}
            >
              {auditStatusLabels[status]}
            </span>
            {!editable ? (
              <span className="text-xs text-muted-foreground">
                Esta auditoria está em modo somente leitura.
              </span>
            ) : null}
          </div>
          {canChangeStatus ? (
            <AuditStatusActions auditId={audit.id} currentStatus={status} />
          ) : null}
        </div>
        {status === "COMPLETED" ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-800">
            Auditoria concluída. O fluxo principal foi finalizado e agora o
            sistema funciona como consulta e rastreabilidade.
          </div>
        ) : status === "CANCELLED" ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-800">
            Auditoria cancelada. O registro permanece no sistema para consulta,
            histórico e precaução futura.
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-2">
          <DetailCard icon={ClipboardCheck} title="Dados da auditoria">
            <DetailList
              items={[
                { label: "Título", value: audit.title },
                { label: "Descrição", value: audit.description },
              ]}
            />
          </DetailCard>

          <DetailCard icon={Building2} title="Empresa vinculada">
            <DetailList
              items={[
                { label: "Empresa", value: audit.company.name },
                { label: "CNPJ/documento", value: audit.company.cnpj },
              ]}
            />
          </DetailCard>

          <DetailCard icon={UserRound} title="Responsáveis">
            <DetailList
              items={[
                { label: "Criador", value: createdBy },
                { label: "Responsável", value: assignedTo },
              ]}
            />
          </DetailCard>

          <DetailCard icon={CalendarDays} title="Datas">
            <DetailList
              items={[
                { label: "Criada em", value: audit.createdAt },
                { label: "Início", value: audit.startDate },
                { label: "Prazo", value: audit.dueDate },
                { label: "Conclusão", value: audit.endDate },
              ]}
            />
          </DetailCard>
        </div>
      </div>
    </details>
  );
}
