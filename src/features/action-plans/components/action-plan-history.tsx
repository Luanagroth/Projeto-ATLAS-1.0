import { History } from "lucide-react";

import type { ActionPlanDetails } from "../services/action-plan-service";

type ActionPlanHistoryProps = {
  history: ActionPlanDetails["history"];
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function userName(user?: { email: string; name: string | null } | null) {
  return user?.name ?? user?.email ?? "Sistema";
}

export function ActionPlanHistory({ history }: ActionPlanHistoryProps) {
  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <History className="size-5 text-muted-foreground" />
        <h2 className="text-base font-semibold">Histórico</h2>
      </div>
      {history.length > 0 ? (
        <div className="mt-4 space-y-3">
          {history.map((item) => (
            <div className="rounded-md border bg-background p-4 text-sm" key={item.id}>
              <p className="font-medium">{item.action}</p>
              <p className="mt-1 text-muted-foreground">
                {formatDateTime(item.createdAt)} - {userName(item.user)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-md border border-dashed bg-background p-4 text-sm text-muted-foreground">
          Nenhum historico registrado.
        </p>
      )}
    </section>
  );
}
