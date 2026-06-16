import { TriangleAlert } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { AuditChecklistExecution } from "@/features/audit-checklists/services/audit-checklist-service";

type AuditPossibleIrregularitiesPanelProps = {
  appliedChecklists: AuditChecklistExecution;
  auditId: string;
  canCreate: boolean;
};

function answerLabel(item: AuditChecklistExecution[number]["items"][number]) {
  const response = item.responses[0];

  if (!response) return "Sem resposta";

  if (item.type === "SIM_NAO") {
    return response.answerChoice === "true"
      ? "Verdadeiro / Sim"
      : response.answerChoice === "false"
        ? "Falso / Nao"
        : "Sem resposta";
  }

  if (item.type === "TEXTO") return response.answerText ?? "Sem resposta";
  if (item.type === "NUMERO") {
    return typeof response.answerNumber === "number"
      ? String(response.answerNumber)
      : "Sem resposta";
  }
  if (item.type === "DATA") {
    return response.answerDate
      ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(
          response.answerDate,
        )
      : "Sem resposta";
  }

  return response.answerChoice ?? "Sem resposta";
}

export function AuditPossibleIrregularitiesPanel({
  appliedChecklists,
  auditId,
  canCreate,
}: AuditPossibleIrregularitiesPanelProps) {
  const possibleItems = appliedChecklists.flatMap((checklist) => {
    return checklist.items
      .filter((item) => {
        const response = item.responses[0];

        return response?.answerBoolean === false;
      })
      .map((item) => ({
        checklistName: checklist.checklistName,
        item,
      }));
  });
  const consolidatedOccurrence = possibleItems
    .flatMap(({ item }) => item.nonConformities)
    .find((nc) => nc.title.startsWith("Ocorrencia de irregularidades"));
  const itemsWithoutNc = possibleItems.filter(
    ({ item }) => item.nonConformities.length === 0,
  );

  return (
    <section className="space-y-4">
      <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4">
        <div className="flex items-start gap-2">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-700" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Passo 2. Revisao antes de virar NC
            </p>
            <p className="mt-1 text-sm text-amber-700">
              Os itens marcados como nao conforme aparecem aqui para revisao.
              Depois de confirmar a analise, crie uma NC consolidada e siga
              para o plano de acao com os itens que precisam ser tratados.
            </p>
          </div>
        </div>
      </div>

      {possibleItems.length > 0 ? (
        <div className="space-y-3">
          <div className="rounded-md border bg-background p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">
                  {possibleItems.length} item
                  {possibleItems.length !== 1 ? "s" : ""} nao conforme
                  {possibleItems.length !== 1 ? "s" : ""} em revisao
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {itemsWithoutNc.length} item
                  {itemsWithoutNc.length !== 1 ? "s" : ""} pendente
                  {itemsWithoutNc.length !== 1 ? "s" : ""} de formalizacao.
                  O ideal e gerar uma unica NC consolidada e um plano de acao
                  que contemple todos eles.
                </p>
              </div>
              {consolidatedOccurrence ? (
                <Button asChild size="sm" variant="outline">
                  <Link
                    href={`/non-conformities/${consolidatedOccurrence.id}?from=${auditId}`}
                  >
                    Ver ocorrencia criada
                  </Link>
                </Button>
              ) : canCreate && itemsWithoutNc.length > 0 ? (
                <Button asChild size="sm">
                  <Link href={`/audits/${auditId}/non-conformities/new?occurrence=1`}>
                    Formalizar NC consolidada
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3">
            {possibleItems.map(({ checklistName, item }) => (
              <div className="rounded-md border bg-background p-4" key={item.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">
                      {checklistName}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold">
                      {item.order}. {item.question}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Resposta:{" "}
                      <span className="font-medium text-foreground">
                        {answerLabel(item)}
                      </span>
                    </p>
                    {item.responses[0]?.notes ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Observacao: {item.responses[0].notes}
                      </p>
                    ) : null}
                    {item.responses[0]?.evidence ? (
                      <a
                        className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
                        href={item.responses[0].evidence}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Abrir evidencia anexada
                      </a>
                    ) : null}
                    {item.nonConformities.length > 0 ? (
                      <p className="mt-2 text-xs font-medium text-emerald-700">
                        Ja formalizado em {item.nonConformities.length} NC
                        {item.nonConformities.length !== 1 ? "s" : ""}.
                      </p>
                    ) : consolidatedOccurrence ? (
                      <p className="mt-2 text-xs font-medium text-emerald-700">
                        Incluido na ocorrencia consolidada.
                      </p>
                    ) : (
                      <p className="mt-2 text-xs font-medium text-amber-700">
                        Sera incluido na ocorrencia sugerida.
                      </p>
                    )}
                  </div>
                  {item.nonConformities[0] ? (
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={`/non-conformities/${item.nonConformities[0].id}?from=${auditId}`}
                      >
                        Ver NC existente
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="rounded-md border border-dashed bg-background p-4 text-sm text-muted-foreground">
          Nenhuma possivel irregularidade encontrada pelos dados atuais.
        </p>
      )}
    </section>
  );
}
