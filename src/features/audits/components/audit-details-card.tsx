import {
  Building2,
  CalendarDays,
  ClipboardCheck,
  FileText,
  TriangleAlert,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { auditStatusLabels } from "../schemas/audit-schema";
import type { AuditDetails } from "../services/audit-service";

type AuditDetailsCardProps = {
  audit: AuditDetails;
};

type DetailItem = {
  label: string;
  value?: Date | string | null;
};

function formatDate(value?: Date | string | null) {
  if (!value) {
    return "Não informado";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(date);
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
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-md bg-muted">
          <Icon className="size-4 text-muted-foreground" />
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
        <div className="rounded-md border bg-background p-4" key={item.label}>
          <dt className="text-sm font-medium text-muted-foreground">
            {item.label}
          </dt>
          <dd className="mt-1 text-sm">
            {item.value instanceof Date
              ? formatDate(item.value)
              : formatText(item.value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function PlaceholderCard({
  icon,
  text,
  title,
}: {
  icon: LucideIcon;
  text: string;
  title: string;
}) {
  return (
    <DetailCard icon={icon} title={title}>
      <p className="text-sm leading-6 text-muted-foreground">{text}</p>
    </DetailCard>
  );
}

export function AuditDetailsCard({ audit }: AuditDetailsCardProps) {
  const createdBy =
    audit.createdBy?.name ?? audit.createdBy?.email ?? "Não informado";
  const assignedTo =
    audit.assignedTo?.name ?? audit.assignedTo?.email ?? "Não informado";

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <DetailCard icon={ClipboardCheck} title="Dados da auditoria">
        <DetailList
          items={[
            { label: "Titulo", value: audit.title },
            { label: "Status", value: auditStatusLabels[audit.status] },
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

      <DetailCard icon={UserRound} title="Responsaveis">
        <DetailList
          items={[
            { label: "Criador", value: createdBy },
            { label: "Responsavel", value: assignedTo },
          ]}
        />
      </DetailCard>

      <DetailCard icon={CalendarDays} title="Datas">
        <DetailList
          items={[
            { label: "Criada em", value: audit.createdAt },
            { label: "Inicio", value: audit.startDate },
            { label: "Prazo", value: audit.dueDate },
            { label: "Fim", value: audit.endDate },
          ]}
        />
      </DetailCard>

      <PlaceholderCard
        icon={TriangleAlert}
        title="Não conformidades"
        text="Em uma etapa futura, as não conformidades desta auditoria serão exibidas aqui."
      />

      <DetailCard icon={FileText} title="Histórico">
        <p className="text-sm leading-6 text-muted-foreground">
          Atualizada em {formatDate(audit.updatedAt)}.
        </p>
      </DetailCard>
    </div>
  );
}
