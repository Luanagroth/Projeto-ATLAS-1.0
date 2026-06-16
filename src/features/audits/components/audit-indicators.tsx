import type { AuditIndicators } from "../services/audit-service";

type AuditIndicatorsProps = {
  indicators: AuditIndicators;
};

type IndicatorCardProps = {
  label: string;
  sublabel?: string;
  value: number;
  variant?: "default" | "warning" | "danger" | "success" | "muted";
};

function IndicatorCard({
  label,
  sublabel,
  value,
  variant = "default",
}: IndicatorCardProps) {
  const colorMap = {
    default: "text-foreground",
    warning: "text-amber-600",
    danger: "text-red-600",
    success: "text-emerald-600",
    muted: "text-muted-foreground",
  };

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground leading-tight">{label}</p>
      {sublabel ? (
        <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sublabel}</p>
      ) : null}
      <p className={`mt-1.5 text-2xl font-bold tabular-nums ${colorMap[variant]}`}>
        {value}
      </p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

export function AuditIndicators({ indicators }: AuditIndicatorsProps) {
  const checklistProgress =
    indicators.itemsTotal > 0
      ? Math.round((indicators.itemsAnswered / indicators.itemsTotal) * 100)
      : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Indicadores
      </h2>

      {/* Bloco — Checklists */}
      <div className="space-y-2">
        <SectionLabel>Checklists</SectionLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <IndicatorCard
            label="Checklists aplicados"
            value={indicators.checklistsApplied}
          />
          <IndicatorCard
            label="Itens totais"
            value={indicators.itemsTotal}
          />
          <IndicatorCard
            label="Itens respondidos"
            value={indicators.itemsAnswered}
          />
          <IndicatorCard
            label="Progresso"
            sublabel="% dos itens respondidos"
            value={checklistProgress}
            variant={
              checklistProgress === 100
                ? "success"
                : checklistProgress > 0
                  ? "default"
                  : "muted"
            }
          />
        </div>
      </div>

      {/* Bloco — Não Conformidades */}
      <div className="space-y-2">
        <SectionLabel>Não conformidades</SectionLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <IndicatorCard
            label="Total de NCs"
            value={indicators.ncsTotal}
          />
          <IndicatorCard
            label="NCs abertas"
            value={indicators.ncsOpen}
            variant={indicators.ncsOpen > 0 ? "warning" : "success"}
          />
          <IndicatorCard
            label="NCs em andamento"
            value={indicators.ncsInProgress}
            variant={indicators.ncsInProgress > 0 ? "default" : "muted"}
          />
          <IndicatorCard
            label="NCs resolvidas"
            value={indicators.ncsResolved}
            variant={indicators.ncsResolved > 0 ? "success" : "muted"}
          />
        </div>
      </div>

      {/* Bloco — Planos de Ação */}
      <div className="space-y-2">
        <SectionLabel>Planos de ação</SectionLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          <IndicatorCard
            label="Total de planos"
            value={indicators.plansTotal}
          />
          <IndicatorCard
            label="Em andamento"
            value={indicators.plansInProgress}
            variant={indicators.plansInProgress > 0 ? "default" : "muted"}
          />
          <IndicatorCard
            label="Aguard. revisão"
            value={indicators.plansAwaitingReview}
            variant={indicators.plansAwaitingReview > 0 ? "warning" : "muted"}
          />
          <IndicatorCard
            label="Concluídos"
            sublabel="Aprovados"
            value={indicators.plansCompleted}
            variant={indicators.plansCompleted > 0 ? "success" : "muted"}
          />
          <IndicatorCard
            label="Reprovados"
            value={indicators.plansRejected}
            variant={indicators.plansRejected > 0 ? "warning" : "muted"}
          />
          <IndicatorCard
            label="Atrasados"
            sublabel="Prazo vencido"
            value={indicators.plansOverdue}
            variant={indicators.plansOverdue > 0 ? "danger" : "success"}
          />
        </div>
      </div>
    </div>
  );
}
