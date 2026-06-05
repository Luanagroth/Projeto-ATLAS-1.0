"use client";

import { useState, useTransition, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { checklistItemTypeLabels } from "@/features/checklists/schemas/checklist-schema";

import { saveAuditChecklistResponsesAction } from "../actions/audit-checklist-actions";
import type { AuditChecklistExecution } from "../services/audit-checklist-service";

type AppliedChecklist = AuditChecklistExecution[number];

type ChecklistExecutionFormProps = {
  auditId: string;
  checklist: AppliedChecklist;
  canRespond: boolean;
};

function optionsFromJson(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((option): option is string => {
    return typeof option === "string" && option.trim().length > 0;
  });
}

function initialAnswer(item: AppliedChecklist["items"][number]) {
  const response = item.responses[0];

  if (!response) {
    return "";
  }

  if (item.type === "SIM_NAO") {
    return typeof response.answerBoolean === "boolean"
      ? String(response.answerBoolean)
      : "";
  }

  if (item.type === "TEXTO") {
    return response.answerText ?? "";
  }

  if (item.type === "NUMERO") {
    return typeof response.answerNumber === "number"
      ? String(response.answerNumber)
      : "";
  }

  if (item.type === "DATA") {
    return response.answerDate
      ? new Date(response.answerDate).toISOString().slice(0, 10)
      : "";
  }

  return response.answerChoice ?? "";
}

export function ChecklistExecutionForm({
  auditId,
  canRespond,
  checklist,
}: ChecklistExecutionFormProps) {
  const [answers, setAnswers] = useState(() => {
    return Object.fromEntries(
      checklist.items.map((item) => [item.id, initialAnswer(item)]),
    );
  });
  const [notes, setNotes] = useState(() => {
    return Object.fromEntries(
      checklist.items.map((item) => [item.id, item.responses[0]?.notes ?? ""]),
    );
  });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await saveAuditChecklistResponsesAction({
        auditId,
        auditChecklistId: checklist.id,
        responses: checklist.items.map((item) => ({
          auditChecklistItemId: item.id,
          type: item.type,
          answerValue: answers[item.id] ?? "",
          notes: notes[item.id] ?? "",
        })),
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage(result.success ?? "Respostas salvas.");
    });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {checklist.items.map((item) => {
        const options = optionsFromJson(item.options);

        return (
          <div className="rounded-md border bg-background p-4" key={item.id}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Label htmlFor={item.id}>
                  {item.order}. {item.question}
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  {checklistItemTypeLabels[item.type]}
                  {item.isRequired ? " • Obrigatorio" : " • Opcional"}
                </p>
              </div>
            </div>

            <div className="mt-3">
              {item.type === "SIM_NAO" ? (
                <select
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  disabled={!canRespond || isPending}
                  id={item.id}
                  onChange={(event) =>
                    setAnswers((current) => ({
                      ...current,
                      [item.id]: event.target.value,
                    }))
                  }
                  value={answers[item.id] ?? ""}
                >
                  <option value="">Selecione</option>
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </select>
              ) : null}

              {item.type === "TEXTO" ? (
                <Textarea
                  disabled={!canRespond || isPending}
                  id={item.id}
                  onChange={(event) =>
                    setAnswers((current) => ({
                      ...current,
                      [item.id]: event.target.value,
                    }))
                  }
                  value={answers[item.id] ?? ""}
                />
              ) : null}

              {item.type === "NUMERO" ? (
                <Input
                  disabled={!canRespond || isPending}
                  id={item.id}
                  onChange={(event) =>
                    setAnswers((current) => ({
                      ...current,
                      [item.id]: event.target.value,
                    }))
                  }
                  type="number"
                  value={answers[item.id] ?? ""}
                />
              ) : null}

              {item.type === "DATA" ? (
                <Input
                  disabled={!canRespond || isPending}
                  id={item.id}
                  onChange={(event) =>
                    setAnswers((current) => ({
                      ...current,
                      [item.id]: event.target.value,
                    }))
                  }
                  type="date"
                  value={answers[item.id] ?? ""}
                />
              ) : null}

              {item.type === "MULTIPLA_ESCOLHA" ? (
                <select
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  disabled={!canRespond || isPending}
                  id={item.id}
                  onChange={(event) =>
                    setAnswers((current) => ({
                      ...current,
                      [item.id]: event.target.value,
                    }))
                  }
                  value={answers[item.id] ?? ""}
                >
                  <option value="">Selecione</option>
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>

            <div className="mt-3 space-y-2">
              <Label htmlFor={`${item.id}-notes`}>Observacoes</Label>
              <Textarea
                disabled={!canRespond || isPending}
                id={`${item.id}-notes`}
                onChange={(event) =>
                  setNotes((current) => ({
                    ...current,
                    [item.id]: event.target.value,
                  }))
                }
                value={notes[item.id] ?? ""}
              />
            </div>
          </div>
        );
      })}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      {canRespond ? (
        <Button disabled={isPending} type="submit">
          {isPending ? "Salvando..." : "Salvar respostas"}
        </Button>
      ) : null}
    </form>
  );
}
