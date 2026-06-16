import {
  CalendarDays,
  ClipboardCheck,
  FileText,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import type { ActionPlanDetails } from "../services/action-plan-service";
import { parseActionPlanExtraFields } from "../services/action-plan-service";
import {
  ActionPlanPriorityBadge,
  ActionPlanStatusBadge,
} from "./action-plan-badges";

type ActionPlanDetailsCardProps = {
  item: ActionPlanDetails;
};

function formatDate(date?: Date | null) {
  return date
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date)
    : "Nao informado";
}

function userName(user?: { email: string; name: string | null } | null) {
  return user?.name ?? user?.email ?? "Nao informado";
}

function formatChecklistAnswer(
  response?: {
    answerBoolean: boolean | null;
    answerChoice: string | null;
    answerDate: Date | null;
    answerNumber: number | null;
    answerText: string | null;
  } | null,
) {
  if (!response) {
    return "Sem resposta registrada";
  }

  if (response.answerText) return response.answerText;
  if (typeof response.answerNumber === "number") return String(response.answerNumber);
  if (response.answerDate) {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
      response.answerDate,
    );
  }
  if (response.answerChoice) return response.answerChoice;
  if (response.answerBoolean === true) return "Conforme";
  if (response.answerBoolean === false) return "Nao conforme";

  return "Sem resposta registrada";
}

export function ActionPlanDetailsCard({ item }: ActionPlanDetailsCardProps) {
  const linkedNonConformities =
    item.nonConformities.length > 0
      ? item.nonConformities.map((link) => link.nonConformity)
      : [item.nonConformity];
  const coveredItems = linkedNonConformities.flatMap((nc) => {
    const linkedItems = nc.checklistItemLinks.map(
      (link) => link.auditChecklistItem,
    );
    const legacyItem = nc.auditChecklistItem;

    return legacyItem ? [...linkedItems, legacyItem] : linkedItems;
  });
  const uniqueCoveredItems = Array.from(
    new Map(
      coveredItems.map((checklistItem) => [
        checklistItem.id,
        {
          ...checklistItem,
          responses:
            "responses" in checklistItem && Array.isArray(checklistItem.responses)
              ? checklistItem.responses
              : [],
        },
      ]),
    ).values(),
  );
  const extraFields = parseActionPlanExtraFields(item.extraFields);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">Dados do plano</h2>
        </div>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border bg-background p-4">
            <dt className="text-sm font-medium text-muted-foreground">
              Prioridade
            </dt>
            <dd className="mt-2">
              <ActionPlanPriorityBadge priority={item.priority} />
            </dd>
          </div>
          <div className="rounded-md border bg-background p-4">
            <dt className="text-sm font-medium text-muted-foreground">
              Status
            </dt>
            <dd className="mt-2">
              <ActionPlanStatusBadge status={item.status} />
            </dd>
          </div>
          <div className="rounded-md border bg-background p-4 sm:col-span-2">
            <dt className="text-sm font-medium text-muted-foreground">
              Descricao
            </dt>
            <dd className="mt-1 whitespace-pre-line text-sm leading-6">
              {item.description ?? "Nenhuma descricao."}
            </dd>
          </div>
          <div className="rounded-md border bg-background p-4 sm:col-span-2">
            <dt className="text-sm font-medium text-muted-foreground">
              Observacoes
            </dt>
            <dd className="mt-1 whitespace-pre-line text-sm leading-6">
              {item.notes ?? "Nenhuma observacao."}
            </dd>
          </div>
          <div className="rounded-md border bg-background p-4 sm:col-span-2">
            <dt className="text-sm font-medium text-muted-foreground">
              Campos extras
            </dt>
            <dd className="mt-2 space-y-2 text-sm leading-6">
              {extraFields.length > 0 ? (
                extraFields.map((field, index) => (
                  <p key={`${String(field.key ?? "campo")}-${index}`}>
                    <strong>{String(field.key ?? "Campo")}:</strong>{" "}
                    {String(field.value ?? "-")}
                  </p>
                ))
              ) : (
                <span>Nenhum campo extra informado.</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <TriangleAlert className="size-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">NCs atendidas</h2>
        </div>
        <dl className="mt-4 space-y-4 text-sm">
          <div>
            <dt className="font-medium text-muted-foreground">Empresa</dt>
            <dd className="mt-1">{item.nonConformity.audit.company.name}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Auditoria</dt>
            <dd className="mt-1">{item.nonConformity.audit.title}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">
              Nao conformidade(s)
            </dt>
            <dd className="mt-1 space-y-1">
              {linkedNonConformities.map((nc) => (
                <Link
                  className="block font-medium text-primary hover:underline"
                  href={`/non-conformities/${nc.id}`}
                  key={nc.id}
                >
                  {nc.title}
                </Link>
              ))}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <UserRound className="size-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">Pessoas</h2>
        </div>
        <dl className="mt-4 space-y-4 text-sm">
          <div>
            <dt className="font-medium text-muted-foreground">Criado por</dt>
            <dd className="mt-1">{userName(item.createdBy)}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Responsavel</dt>
            <dd className="mt-1">{userName(item.responsible)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">Datas</h2>
        </div>
        <dl className="mt-4 space-y-4 text-sm">
          <div>
            <dt className="font-medium text-muted-foreground">Prazo</dt>
            <dd className="mt-1">{formatDate(item.dueDate)}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Concluido em</dt>
            <dd className="mt-1">{formatDate(item.completedAt)}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Criado em</dt>
            <dd className="mt-1">{formatDate(item.createdAt)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm lg:col-span-2">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">
            Itens com pendencia para tratar
          </h2>
        </div>
        {uniqueCoveredItems.length > 0 ? (
          <div className="mt-4 grid gap-2">
            {uniqueCoveredItems.map((checklistItem) => (
              <div
                className="rounded-md border bg-background p-3 text-sm"
                key={checklistItem.id}
              >
                <p className="text-xs font-medium text-muted-foreground">
                  {checklistItem.auditChecklist.checklistName}
                </p>
                <p className="mt-1 font-medium">
                  {checklistItem.order}. {checklistItem.question}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  <strong>Resposta atual:</strong>{" "}
                  {formatChecklistAnswer(checklistItem.responses[0])}
                </p>
                {checklistItem.responses[0]?.answerBoolean === false ? (
                  <p className="mt-1 text-xs font-medium text-amber-700">
                    Marcado como nao conforme na auditoria.
                  </p>
                ) : null}
                {checklistItem.responses[0]?.notes ? (
                  <p className="mt-2 whitespace-pre-line text-xs text-muted-foreground">
                    <strong>Observacao do checklist:</strong>{" "}
                    {checklistItem.responses[0].notes}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-md border border-dashed bg-background p-4 text-sm text-muted-foreground">
            Nenhum item de checklist vinculado a este plano.
          </p>
        )}
      </section>
    </div>
  );
}
