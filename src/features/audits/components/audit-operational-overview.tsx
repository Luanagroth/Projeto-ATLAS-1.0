import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileClock,
  FileText,
  SearchCheck,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import { auditOpinionStatusLabels } from "../schemas/audit-opinion-schema";
import { auditStatusLabels } from "../schemas/audit-schema";
import type {
  AuditDetails,
  AuditOperationalOverview,
} from "../services/audit-service";

type AuditOperationalOverviewProps = {
  audit: AuditDetails;
  overview: AuditOperationalOverview;
};

function Metric({
  label,
  tone = "default",
  value,
}: {
  label: string;
  tone?: "default" | "danger" | "success" | "warning";
  value: number | string;
}) {
  const classes = {
    default: "border-border bg-background",
    danger: "border-red-200 bg-red-50 text-red-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <div className={`rounded-xl border p-3 ${classes[tone]}`}>
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function buildContextMessage(
  audit: AuditDetails,
  overview: AuditOperationalOverview,
) {
  if (audit.status === "COMPLETED") {
    return {
      description:
        "Auditoria concluída. O registro segue para consulta, rastreabilidade e histórico.",
      icon: CheckCircle2,
      tone: "success" as const,
      title: "Fluxo encerrado",
    };
  }

  if (audit.status === "CANCELLED") {
    return {
      description: "Auditoria cancelada. A tela permanece apenas para consulta.",
      icon: XCircle,
      tone: "danger" as const,
      title: "Fluxo cancelado",
    };
  }

  if (overview.plansAwaitingResponse > 0) {
    return {
      description:
        "A empresa precisa responder os planos de ação que estão em aberto.",
      icon: FileClock,
      tone: "warning" as const,
      title: "Plano aguardando resposta",
    };
  }

  if (overview.plansInVerification > 0) {
    return {
      description:
        "A resposta da empresa já foi enviada e agora aguarda validação da auditora.",
      icon: SearchCheck,
      tone: "warning" as const,
      title: "Resposta em verificação",
    };
  }

  if (overview.possibleIrregularities > 0) {
    return {
      description:
        "Existem itens com possível desvio aguardando formalização de NC.",
      icon: AlertTriangle,
      tone: "warning" as const,
      title: "Revisar irregularidades",
    };
  }

  if (overview.pendingEvidences > 0) {
    return {
      description:
        "Há evidências registradas que ainda merecem validação da auditora.",
      icon: ShieldAlert,
      tone: "warning" as const,
      title: "Evidências pendentes",
    };
  }

  if (overview.needsOpinionBeforeClose) {
    return {
      description:
        "A auditoria ainda precisa do parecer final antes do encerramento.",
      icon: FileText,
      tone: "warning" as const,
      title: "Parecer pendente",
    };
  }

  return {
    description: "Nenhuma pendencia critica detectada nos dados atuais.",
    icon: CheckCircle2,
    tone: "success" as const,
    title: "Fluxo consistente",
  };
}

export function AuditOperationalOverview({
  audit,
  overview,
}: AuditOperationalOverviewProps) {
  const context = buildContextMessage(audit, overview);
  const ContextIcon = context.icon;

  return (
    <section className="space-y-4 rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Visão operacional
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            {auditStatusLabels[audit.status]}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1">
            <ClipboardCheck className="size-3" />
            {overview.checklistsApplied} checklist
            {overview.checklistsApplied !== 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1">
            <FileText className="size-3" />
            {overview.documentsCount} documento
            {overview.documentsCount !== 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1">
            <ShieldAlert className="size-3" />
            {overview.pendingEvidences}{" "}
            {overview.pendingEvidences === 1 ? "evidência pendente" : "evidências pendentes"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1">
            <CheckCircle2 className="size-3" />
            {auditOpinionStatusLabels[overview.opinionStatus]}
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Metric
          label="Itens conformes"
          tone="success"
          value={overview.conformingItems}
        />
        <Metric
          label="Itens não conformes"
          tone={overview.nonConformingItems > 0 ? "danger" : "default"}
          value={overview.nonConformingItems}
        />
        <Metric
          label="NCs abertas"
          tone={overview.ncsOpen > 0 ? "danger" : "default"}
          value={overview.ncsOpen}
        />
        <Metric label="Planos de ação" value={overview.actionPlans} />
        <Metric
          label="Aguardando resposta"
          tone={overview.plansAwaitingResponse > 0 ? "warning" : "default"}
          value={overview.plansAwaitingResponse}
        />
        <Metric
          label="Em verificação"
          tone={overview.plansInVerification > 0 ? "warning" : "default"}
          value={overview.plansInVerification}
        />
      </div>

      <div
        className={`flex gap-2 rounded-xl border p-3 text-sm ${
          context.tone === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : context.tone === "danger"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
        }`}
      >
        <ContextIcon className="mt-0.5 size-4 shrink-0" />
        <div>
          <p className="font-medium">{context.title}</p>
          <p>{context.description}</p>
        </div>
      </div>
    </section>
  );
}
