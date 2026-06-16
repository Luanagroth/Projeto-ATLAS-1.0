"use client";

import { CheckCircle2, ExternalLink, RotateCcw, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  createEvidenceAction,
  reviewEvidenceAction,
} from "../actions/evidence-actions";
import type { ActionPlanDetails } from "../services/action-plan-service";
import {
  evidenceOriginLabels,
  evidenceStatusLabels,
  type EvidenceFormValues,
} from "../schemas/evidence-schema";

type ActionPlanEvidencesPanelProps = {
  canReview: boolean;
  item: ActionPlanDetails;
};

function userName(user?: { email: string; name: string | null } | null) {
  return user?.name ?? user?.email ?? "Nao informado";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function ActionPlanEvidencesPanel({
  canReview,
  item,
}: ActionPlanEvidencesPanelProps) {
  const linkedNonConformities =
    item.nonConformities.length > 0
      ? item.nonConformities.map((link) => link.nonConformity)
      : [item.nonConformity];
  const checklistItems = Array.from(
    new Map(
      linkedNonConformities
        .flatMap((nc) => {
          const linkedItems = nc.checklistItemLinks.map(
            (link) => link.auditChecklistItem,
          );
          return nc.auditChecklistItem
            ? [...linkedItems, nc.auditChecklistItem]
            : linkedItems;
        })
        .map((checklistItem) => [checklistItem.id, checklistItem]),
    ).values(),
  );
  const companyEvidences = item.evidences.filter(
    (evidence) => evidence.origin === "EMPRESA",
  );
  const auditorEvidences = item.evidences.filter(
    (evidence) => evidence.origin === "AUDITORIA",
  );

  return (
    <section className="space-y-4 rounded-lg border bg-card p-5 shadow-sm">
      <div>
        <h2 className="text-base font-semibold">Evidencias e respostas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A empresa responde por aqui com anexos, links e observacoes. A
          auditora visualiza essas respostas e decide se aprova ou solicita
          ajustes.
        </p>
      </div>

      <EvidenceForm
        actionPlanId={item.id}
        checklistItems={checklistItems}
        nonConformities={linkedNonConformities}
      />

      <div className="space-y-3">
        {item.evidences.length > 0 ? (
          <>
            <EvidenceGroup
              canReview={canReview}
              evidences={companyEvidences}
              title="Resposta da empresa"
            />
            <EvidenceGroup
              canReview={false}
              evidences={auditorEvidences}
              title="Registros da auditoria"
            />
          </>
        ) : (
          <p className="rounded-md border border-dashed bg-background p-4 text-sm text-muted-foreground">
            Nenhuma evidencia anexada ainda.
          </p>
        )}
      </div>
    </section>
  );
}

function EvidenceGroup({
  canReview,
  evidences,
  title,
}: {
  canReview: boolean;
  evidences: ActionPlanDetails["evidences"];
  title: string;
}) {
  if (evidences.length === 0) {
    return (
      <div className="rounded-md border border-dashed bg-background p-4 text-sm text-muted-foreground">
        {title}: nenhum registro ainda.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">
          {canReview
            ? "Aqui a auditora acompanha o retorno enviado pela empresa."
            : "Materiais anexados pela equipe de auditoria para contextualizar o plano."}
        </p>
      </div>
      {evidences.map((evidence) => (
        <div className="rounded-md border bg-background p-4" key={evidence.id}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold">{evidence.title}</h3>
                <span className="rounded-md border px-2 py-0.5 text-xs font-medium">
                  {evidenceOriginLabels[evidence.origin]}
                </span>
                <span className="rounded-md border px-2 py-0.5 text-xs font-medium">
                  {evidenceStatusLabels[evidence.status]}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Anexado por {userName(evidence.attachedBy)} em{" "}
                {formatDate(evidence.createdAt)}
              </p>
              {evidence.description ? (
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                  {evidence.description}
                </p>
              ) : null}
              {evidence.nonConformity ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  NC: {evidence.nonConformity.title}
                </p>
              ) : null}
              {evidence.auditChecklistItem ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Item: {evidence.auditChecklistItem.auditChecklist.checklistName} -{" "}
                  {evidence.auditChecklistItem.question}
                </p>
              ) : null}
              {evidence.fileUrl ? (
                <a
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  href={evidence.fileUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Abrir arquivo/link
                  <ExternalLink className="size-3" />
                </a>
              ) : null}
              {evidence.reviewNotes ? (
                <p className="mt-2 rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">
                  Verificacao da auditora: {evidence.reviewNotes}
                </p>
              ) : null}
            </div>

            {canReview ? <EvidenceReviewForm evidenceId={evidence.id} /> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function EvidenceForm({
  actionPlanId,
  checklistItems,
  nonConformities,
}: {
  actionPlanId: string;
  checklistItems: Array<{
    auditChecklist: { checklistName: string };
    id: string;
    order: number;
    question: string;
  }>;
  nonConformities: Array<{ id: string; title: string }>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<EvidenceFormValues>({
    actionPlanId,
    nonConformityId: nonConformities[0]?.id ?? "",
    auditChecklistItemId: "",
    title: "",
    description: "",
    fileUrl: "",
    origin: "EMPRESA",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateValue<K extends keyof EvidenceFormValues>(
    field: K,
    value: EvidenceFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await createEvidenceAction(values);

      if (!("ok" in result)) {
        setError(
          result.error ??
            Object.values(result.fieldErrors ?? {}).find(Boolean) ??
            "Revise os dados da evidencia.",
        );
        return;
      }

      setValues((current) => ({
        ...current,
        auditChecklistItemId: "",
        title: "",
        description: "",
        fileUrl: "",
      }));
      setMessage("Evidencia anexada.");
      router.refresh();
    });
  }

  return (
    <form className="rounded-md border bg-background p-4" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <input type="hidden" value={actionPlanId} />

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="evidence-title">Titulo</Label>
          <Input
            disabled={isPending}
            id="evidence-title"
            onChange={(event) => updateValue("title", event.target.value)}
            value={values.title}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="evidence-origin">Origem</Label>
          <select
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            disabled={isPending}
            id="evidence-origin"
            onChange={(event) =>
              updateValue(
                "origin",
                event.target.value as EvidenceFormValues["origin"],
              )
            }
            value={values.origin}
          >
            <option value="EMPRESA">Empresa auditada</option>
            <option value="AUDITORIA">Auditoria</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="evidence-nc">NC vinculada</Label>
          <select
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            disabled={isPending}
            id="evidence-nc"
            onChange={(event) =>
              updateValue("nonConformityId", event.target.value)
            }
            value={values.nonConformityId ?? ""}
          >
            {nonConformities.map((nc) => (
              <option key={nc.id} value={nc.id}>
                {nc.title}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="evidence-item">Item da checklist opcional</Label>
          <select
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            disabled={isPending}
            id="evidence-item"
            onChange={(event) =>
              updateValue("auditChecklistItemId", event.target.value)
            }
            value={values.auditChecklistItemId ?? ""}
          >
            <option value="">Sem item especifico</option>
            {checklistItems.map((checklistItem) => (
              <option key={checklistItem.id} value={checklistItem.id}>
                {checklistItem.auditChecklist.checklistName} -{" "}
                {checklistItem.order}. {checklistItem.question}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="evidence-file-url">Arquivo/link opcional</Label>
          <Input
            disabled={isPending}
            id="evidence-file-url"
            onChange={(event) => updateValue("fileUrl", event.target.value)}
            placeholder="https://..."
            value={values.fileUrl ?? ""}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="evidence-description">Descricao opcional</Label>
          <Textarea
            disabled={isPending}
            id="evidence-description"
            onChange={(event) => updateValue("description", event.target.value)}
            value={values.description ?? ""}
          />
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}

      <Button className="mt-4" disabled={isPending} type="submit">
        {isPending ? "Anexando..." : "Anexar evidencia"}
      </Button>
    </form>
  );
}

function EvidenceReviewForm({ evidenceId }: { evidenceId: string }) {
  const router = useRouter();
  const [reviewNotes, setReviewNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function review(status: "APPROVED" | "REJECTED" | "ADJUSTMENT_REQUESTED") {
    if (isPending) return;

    setError(null);
    setPendingStatus(status);

    startTransition(async () => {
      const result = await reviewEvidenceAction({
        evidenceId,
        status,
        reviewNotes,
      });

      if (!("ok" in result)) {
        setError(
          result.error ??
            Object.values(result.fieldErrors ?? {}).find(Boolean) ??
            "Nao foi possivel revisar.",
        );
        setPendingStatus(null);
        return;
      }

      setReviewNotes("");
      setPendingStatus(null);
      router.refresh();
    });
  }

  return (
    <div className="w-full shrink-0 space-y-2 lg:w-64">
      <Label htmlFor={`review-${evidenceId}`}>Observacao da verificacao</Label>
      <Textarea
        disabled={isPending}
        id={`review-${evidenceId}`}
        onChange={(event) => setReviewNotes(event.target.value)}
        value={reviewNotes}
      />
      <div className="grid gap-2">
        <Button
          disabled={isPending}
          onClick={() => review("APPROVED")}
          size="sm"
          type="button"
        >
          <CheckCircle2 />
          {pendingStatus === "APPROVED" ? "Aprovando..." : "Aprovar evidencia"}
        </Button>
        <Button
          disabled={isPending}
          onClick={() => review("ADJUSTMENT_REQUESTED")}
          size="sm"
          type="button"
          variant="outline"
        >
          <RotateCcw />
          {pendingStatus === "ADJUSTMENT_REQUESTED"
            ? "Solicitando..."
            : "Solicitar ajuste na evidencia"}
        </Button>
        <Button
          disabled={isPending}
          onClick={() => review("REJECTED")}
          size="sm"
          type="button"
          variant="destructive"
        >
          <XCircle />
          {pendingStatus === "REJECTED" ? "Reprovando..." : "Reprovar evidencia"}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
