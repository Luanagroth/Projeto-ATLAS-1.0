"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { saveAuditOpinionAction } from "../actions/audit-opinion-actions";
import {
  auditOpinionStatusLabels,
  type AuditOpinionFormValues,
} from "../schemas/audit-opinion-schema";
import type { AuditOpinionDetails } from "../services/audit-opinion-service";

type AuditOpinionPanelProps = {
  auditId: string;
  canEdit: boolean;
  opinion: AuditOpinionDetails | null;
};

const fields: Array<{
  key: keyof Omit<AuditOpinionFormValues, "auditId" | "status">;
  label: string;
}> = [
  { key: "companyBrief", label: "Descricao breve da empresa" },
  { key: "generalCare", label: "Cuidados gerais" },
  { key: "positivePoints", label: "Pontos positivos" },
  { key: "criticalPoints", label: "Pontos criticos" },
  { key: "overallPerformance", label: "Performance geral" },
  { key: "identifiedRisks", label: "Riscos identificados" },
  { key: "recommendations", label: "Recomendacoes" },
  { key: "finalOpinion", label: "Parecer final da auditora" },
];

function userName(user?: { email: string; name: string | null } | null) {
  return user?.name ?? user?.email ?? "Nao informado";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function AuditOpinionPanel({
  auditId,
  canEdit,
  opinion,
}: AuditOpinionPanelProps) {
  const router = useRouter();
  const [values, setValues] = useState<AuditOpinionFormValues>({
    auditId,
    companyBrief: opinion?.companyBrief ?? "",
    generalCare: opinion?.generalCare ?? "",
    positivePoints: opinion?.positivePoints ?? "",
    criticalPoints: opinion?.criticalPoints ?? "",
    overallPerformance: opinion?.overallPerformance ?? "",
    identifiedRisks: opinion?.identifiedRisks ?? "",
    recommendations: opinion?.recommendations ?? "",
    finalOpinion: opinion?.finalOpinion ?? "",
    status: opinion?.status ?? "DRAFT",
  });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateValue(field: keyof AuditOpinionFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function submit(status: AuditOpinionFormValues["status"]) {
    if (isPending) return;

    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await saveAuditOpinionAction({ ...values, status });

      if (!result.ok) {
        setError(
          result.error ??
            Object.values(result.fieldErrors ?? {}).find(Boolean) ??
            "Revise o parecer.",
        );
        return;
      }

      setValues((current) => ({ ...current, status }));
      setMessage(
        status === "COMPLETED"
          ? "Parecer concluido."
          : "Parecer salvo como rascunho.",
      );
      router.refresh();
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit("DRAFT");
  }

  return (
    <section className="space-y-5">
      <div className="rounded-md border bg-background p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Status do parecer</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {auditOpinionStatusLabels[values.status]}
              {opinion?.updatedAt ? ` | Atualizado em ${formatDate(opinion.updatedAt)}` : ""}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Responsavel: {userName(opinion?.responsible)}
          </p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 xl:grid-cols-2">
          {fields.map((field) => (
            <div className="space-y-2" key={field.key}>
              <Label htmlFor={`opinion-${field.key}`}>{field.label}</Label>
              <Textarea
                disabled={!canEdit || isPending}
                id={`opinion-${field.key}`}
                onChange={(event) => updateValue(field.key, event.target.value)}
                value={values[field.key] ?? ""}
              />
            </div>
          ))}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

        {canEdit ? (
          <div className="flex flex-wrap gap-2">
            <Button disabled={isPending} type="submit" variant="outline">
              {isPending ? "Salvando..." : "Salvar rascunho"}
            </Button>
            <Button
              disabled={isPending}
              onClick={() => submit("COMPLETED")}
              type="button"
            >
              Marcar como concluido
            </Button>
          </div>
        ) : null}
      </form>

      <div className="rounded-md border bg-background p-4">
        <h3 className="text-sm font-semibold">Historico do parecer</h3>
        {opinion?.history.length ? (
          <div className="mt-3 space-y-2">
            {opinion.history.map((item) => (
              <div className="rounded-md border bg-muted/20 p-3 text-sm" key={item.id}>
                <p className="font-medium">{item.action}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {userName(item.user)} | {formatDate(item.createdAt)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Nenhuma alteracao registrada ainda.
          </p>
        )}
      </div>
    </section>
  );
}
