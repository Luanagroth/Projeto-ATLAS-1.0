import {
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  FileText,
  MapPin,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import type { CompanyDetails } from "../services/company-service";

type CompanyDetailsCardProps = {
  company: CompanyDetails;
};

type DetailItem = {
  label: string;
  value?: number | string | null;
};

type ExtraField = {
  key: string;
  value: string;
};

function formatValue(value?: number | string | null) {
  if (typeof value === "number") {
    return String(value);
  }

  const trimmed = value?.trim();

  return trimmed || "Não informado";
}

function parseExtraFields(value: unknown): ExtraField[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((field) => {
      if (!field || typeof field !== "object") {
        return null;
      }

      const record = field as Record<string, unknown>;
      const key = typeof record.key === "string" ? record.key.trim() : "";
      const fieldValue =
        typeof record.value === "string" ? record.value.trim() : "";

      return key || fieldValue ? { key, value: fieldValue } : null;
    })
    .filter((field): field is ExtraField => Boolean(field));
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
          <dd className="mt-1 text-sm">{formatValue(item.value)}</dd>
        </div>
      ))}
    </dl>
  );
}

export function CompanyDetailsCard({ company }: CompanyDetailsCardProps) {
  const extraFields = parseExtraFields(company.extraFields);

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <DetailCard icon={Building2} title="Dados principais">
        <DetailList
          items={[
            { label: "Nome", value: company.name },
            { label: "Nome fantasia", value: company.tradeName },
            { label: "Razao social", value: company.legalName },
            { label: "Tipo de documento", value: company.documentType },
            { label: "CNPJ/documento", value: company.cnpj },
            { label: "Tipo juridico", value: company.legalType },
          ]}
        />
      </DetailCard>

      <DetailCard icon={UserRound} title="Responsavel">
        <DetailList
          items={[
            { label: "Nome", value: company.responsibleName },
            { label: "Cargo", value: company.responsibleRole },
            { label: "Email", value: company.email },
            { label: "Telefone", value: company.phone },
          ]}
        />
      </DetailCard>

      <DetailCard icon={MapPin} title="Localização">
        <DetailList
          items={[
            { label: "Endereco", value: company.address },
            { label: "CEP", value: company.zipCode },
            { label: "Cidade", value: company.city },
            { label: "Estado", value: company.state },
            { label: "Pais", value: company.country },
          ]}
        />
      </DetailCard>

      <DetailCard icon={BriefcaseBusiness} title="Informacoes operacionais">
        <DetailList
          items={[
            { label: "Ramo de atuação", value: company.segment },
            { label: "Colaboradores", value: company.employeeCount },
            { label: "Descrição", value: company.description },
          ]}
        />
      </DetailCard>

      <DetailCard icon={FileText} title="Observacoes">
        <p className="text-sm leading-6">{formatValue(company.notes)}</p>
      </DetailCard>

      <DetailCard icon={ClipboardList} title="Campos extras">
        {extraFields.length > 0 ? (
          <DetailList
            items={extraFields.map((field) => ({
              label: field.key || "Campo sem nome",
              value: field.value,
            }))}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum campo extra cadastrado.
          </p>
        )}
      </DetailCard>
    </div>
  );
}
