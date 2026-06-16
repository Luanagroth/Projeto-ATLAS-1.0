import { CalendarDays, FileText, ListChecks, Tags } from "lucide-react";

import {
  checklistItemTypeLabels,
  type ChecklistItemFormValues,
} from "../schemas/checklist-schema";
import type { ChecklistDetails } from "../services/checklist-service";

type ChecklistDetailsCardProps = {
  checklist: ChecklistDetails;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(date);
}

function formatOptions(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  const options = value.filter((option): option is string => {
    return typeof option === "string" && option.trim().length > 0;
  });

  return options.length > 0 ? options.join(", ") : null;
}

export function ChecklistDetailsCard({ checklist }: ChecklistDetailsCardProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-muted">
            <ListChecks className="size-4 text-muted-foreground" />
          </div>
          <h2 className="text-base font-semibold">Itens do modelo de checklist</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Este template não fica vinculado diretamente a uma empresa. O vínculo
          acontece quando ele e aplicado dentro de uma auditoria.
        </p>

        <div className="mt-4 space-y-3">
          {checklist.items.map((item) => (
            <article className="rounded-md border bg-background p-4" key={item.id}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {item.order}. {item.question}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {checklistItemTypeLabels[item.type as ChecklistItemFormValues["type"]]}
                    {item.isRequired ? " • Obrigatorio" : " • Opcional"}
                  </p>
                </div>
              </div>
              {formatOptions(item.options) ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Opcoes: {formatOptions(item.options)}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <aside className="space-y-5">
        <section className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Tags className="size-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Resumo</h2>
          </div>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="font-medium text-muted-foreground">Categoria</dt>
              <dd className="mt-1">{checklist.category ?? "Sem categoria"}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Status</dt>
              <dd className="mt-1">{checklist.isActive ? "Ativo" : "Inativo"}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Versao</dt>
              <dd className="mt-1">{checklist.version}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Descrição</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {checklist.description ?? "Nenhuma descricao cadastrada."}
          </p>
        </section>

        <section className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Datas</h2>
          </div>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="font-medium text-muted-foreground">Criado em</dt>
              <dd className="mt-1">{formatDate(checklist.createdAt)}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Atualizado em</dt>
              <dd className="mt-1">{formatDate(checklist.updatedAt)}</dd>
            </div>
          </dl>
        </section>
      </aside>
    </div>
  );
}
