import { TriangleAlert } from "lucide-react";

export function NonConformitiesEmptyState() {
  return (
    <div className="rounded-lg border border-dashed bg-card p-8 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-md bg-muted">
        <TriangleAlert className="size-6 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">
        Nenhuma não conformidade registrada
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        As não conformidades criadas manualmente durante auditorias aparecerão
        aqui.
      </p>
    </div>
  );
}
