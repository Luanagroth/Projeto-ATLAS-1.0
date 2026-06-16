import { CheckCircle2, Clock, RotateCcw, Timer, XCircle } from "lucide-react";

type ActionPlanIndicatorsProps = {
  indicators: {
    approved: number;
    awaitingReview: number;
    inProgress: number;
    open: number;
    rejected: number;
  };
};

const items = [
  { key: "open", label: "Abertos", icon: Clock },
  { key: "inProgress", label: "Em andamento", icon: Timer },
  { key: "awaitingReview", label: "Aguardando revisao", icon: RotateCcw },
  { key: "approved", label: "Aprovados", icon: CheckCircle2 },
  { key: "rejected", label: "Reprovados", icon: XCircle },
] as const;

export function ActionPlanIndicators({ indicators }: ActionPlanIndicatorsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div className="rounded-lg border bg-card p-4 shadow-sm" key={item.key}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">
                {item.label}
              </p>
              <Icon className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-3 text-2xl font-semibold">
              {indicators[item.key]}
            </p>
          </div>
        );
      })}
    </div>
  );
}
