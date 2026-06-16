"use client";

import { ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  createAuditDocumentAction,
  deleteAuditDocumentAction,
} from "../actions/audit-document-actions";
import {
  auditDocumentOriginLabels,
  auditDocumentOriginOptions,
  type AuditDocumentFormValues,
} from "../schemas/audit-document-schema";
import type {
  AuditDocumentItem,
  AuditDocumentLinkOptions,
} from "../services/audit-document-service";

type AuditDocumentsPanelProps = {
  auditId: string;
  canManage: boolean;
  categories: string[];
  documents: AuditDocumentItem[];
  linkOptions: AuditDocumentLinkOptions;
  selectedCategory?: string;
  selectedOrigin?: string;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function userName(user?: { email: string; name: string | null } | null) {
  return user?.name ?? user?.email ?? "Nao informado";
}

export function AuditDocumentsPanel({
  auditId,
  canManage,
  categories,
  documents,
  linkOptions,
  selectedCategory,
  selectedOrigin,
}: AuditDocumentsPanelProps) {
  return (
    <section className="space-y-5">
      <form className="rounded-md border bg-background p-4" action={`/audits/${auditId}`}>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            defaultValue={selectedOrigin ?? ""}
            name="docOrigin"
          >
            <option value="">Todas as origens</option>
            {auditDocumentOriginOptions.map((origin) => (
              <option key={origin} value={origin}>
                {auditDocumentOriginLabels[origin]}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            defaultValue={selectedCategory ?? ""}
            name="docCategory"
          >
            <option value="">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button type="submit">Filtrar</Button>
            <Button asChild type="button" variant="outline">
              <Link href={`/audits/${auditId}`}>Limpar</Link>
            </Button>
          </div>
        </div>
      </form>

      {canManage ? (
        <AuditDocumentForm auditId={auditId} linkOptions={linkOptions} />
      ) : null}

      <div className="space-y-3">
        {documents.length > 0 ? (
          documents.map((document) => (
            <div className="rounded-md border bg-background p-4" key={document.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold">{document.title}</h3>
                    <span className="rounded border px-1.5 py-0.5 text-xs">
                      {auditDocumentOriginLabels[document.origin]}
                    </span>
                    {document.category ? (
                      <span className="rounded border px-1.5 py-0.5 text-xs">
                        {document.category}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {userName(document.attachedBy)} | {formatDate(document.createdAt)}
                  </p>
                  {document.description ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {document.description}
                    </p>
                  ) : null}
                  <LinkedEntities document={document} />
                  {document.fileUrl ? (
                    <a
                      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      href={document.fileUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Abrir arquivo/link
                      <ExternalLink className="size-3" />
                    </a>
                  ) : null}
                </div>
                {canManage ? (
                  <DeleteDocumentButton auditId={auditId} documentId={document.id} />
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-md border border-dashed bg-background p-4 text-sm text-muted-foreground">
            Nenhum documento encontrado para os filtros atuais.
          </p>
        )}
      </div>
    </section>
  );
}

function LinkedEntities({ document }: { document: AuditDocumentItem }) {
  const links = [
    document.auditChecklist
      ? `Checklist: ${document.auditChecklist.checklistName}`
      : null,
    document.auditChecklistItem
      ? `Item: ${document.auditChecklistItem.auditChecklist.checklistName} - ${document.auditChecklistItem.question}`
      : null,
    document.nonConformity ? `NC: ${document.nonConformity.title}` : null,
    document.actionPlan ? `Plano: ${document.actionPlan.title}` : null,
    document.evidence ? `Evidencia: ${document.evidence.title}` : null,
  ].filter(Boolean);

  return links.length > 0 ? (
    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
      {links.map((link) => (
        <p key={link}>{link}</p>
      ))}
    </div>
  ) : null;
}

function AuditDocumentForm({
  auditId,
  linkOptions,
}: {
  auditId: string;
  linkOptions: AuditDocumentLinkOptions;
}) {
  const router = useRouter();
  const [values, setValues] = useState<AuditDocumentFormValues>({
    auditId,
    auditChecklistId: "",
    auditChecklistItemId: "",
    nonConformityId: "",
    actionPlanId: "",
    evidenceId: "",
    title: "",
    description: "",
    category: "",
    fileUrl: "",
    origin: "AUDITORIA",
  });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateValue<K extends keyof AuditDocumentFormValues>(
    field: K,
    value: AuditDocumentFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await createAuditDocumentAction(values);

      if (!result.ok) {
        setError(
          result.error ??
            Object.values(result.fieldErrors ?? {}).find(Boolean) ??
            "Revise o documento.",
        );
        return;
      }

      setValues((current) => ({
        ...current,
        auditChecklistId: "",
        auditChecklistItemId: "",
        nonConformityId: "",
        actionPlanId: "",
        evidenceId: "",
        title: "",
        description: "",
        category: "",
        fileUrl: "",
      }));
      setMessage("Documento anexado.");
      router.refresh();
    });
  }

  return (
    <form className="rounded-md border bg-background p-4" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="document-title">Titulo</Label>
          <Input
            disabled={isPending}
            id="document-title"
            onChange={(event) => updateValue("title", event.target.value)}
            value={values.title}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="document-category">Tipo/categoria</Label>
          <Input
            disabled={isPending}
            id="document-category"
            onChange={(event) => updateValue("category", event.target.value)}
            placeholder="Relatorio, planilha, contrato..."
            value={values.category ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="document-origin">Origem</Label>
          <select
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            disabled={isPending}
            id="document-origin"
            onChange={(event) =>
              updateValue(
                "origin",
                event.target.value as AuditDocumentFormValues["origin"],
              )
            }
            value={values.origin}
          >
            {auditDocumentOriginOptions.map((origin) => (
              <option key={origin} value={origin}>
                {auditDocumentOriginLabels[origin]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="document-file">Arquivo ou link</Label>
          <Input
            disabled={isPending}
            id="document-file"
            onChange={(event) => updateValue("fileUrl", event.target.value)}
            placeholder="https://..."
            value={values.fileUrl ?? ""}
          />
        </div>
        <SelectField
          disabled={isPending}
          label="Checklist opcional"
          onChange={(value) => updateValue("auditChecklistId", value)}
          options={linkOptions.checklists.map((item) => ({
            label: item.checklistName,
            value: item.id,
          }))}
          value={values.auditChecklistId ?? ""}
        />
        <SelectField
          disabled={isPending}
          label="Item de checklist opcional"
          onChange={(value) => updateValue("auditChecklistItemId", value)}
          options={linkOptions.checklistItems.map((item) => ({
            label: `${item.auditChecklist.checklistName} - ${item.order}. ${item.question}`,
            value: item.id,
          }))}
          value={values.auditChecklistItemId ?? ""}
        />
        <SelectField
          disabled={isPending}
          label="NC opcional"
          onChange={(value) => updateValue("nonConformityId", value)}
          options={linkOptions.nonConformities.map((item) => ({
            label: item.title,
            value: item.id,
          }))}
          value={values.nonConformityId ?? ""}
        />
        <SelectField
          disabled={isPending}
          label="Plano de acao opcional"
          onChange={(value) => updateValue("actionPlanId", value)}
          options={linkOptions.actionPlans.map((item) => ({
            label: item.title,
            value: item.id,
          }))}
          value={values.actionPlanId ?? ""}
        />
        <SelectField
          disabled={isPending}
          label="Evidencia opcional"
          onChange={(value) => updateValue("evidenceId", value)}
          options={linkOptions.evidences.map((item) => ({
            label: item.title,
            value: item.id,
          }))}
          value={values.evidenceId ?? ""}
        />
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="document-description">Descricao opcional</Label>
          <Textarea
            disabled={isPending}
            id="document-description"
            onChange={(event) => updateValue("description", event.target.value)}
            value={values.description ?? ""}
          />
        </div>
      </div>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
      <Button className="mt-4" disabled={isPending} type="submit">
        {isPending ? "Anexando..." : "Anexar documento"}
      </Button>
    </form>
  );
}

function SelectField({
  disabled,
  label,
  onChange,
  options,
  value,
}: {
  disabled: boolean;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">Sem vinculo</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function DeleteDocumentButton({
  auditId,
  documentId,
}: {
  auditId: string;
  documentId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    if (isPending) return;
    if (!window.confirm("Remover este documento?")) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteAuditDocumentAction({ auditId, documentId });
      if (!result.ok) {
        setError(result.error ?? "Nao foi possivel remover.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button
        disabled={isPending}
        onClick={onDelete}
        size="sm"
        type="button"
        variant="destructive"
      >
        <Trash2 className="size-4" />
        {isPending ? "Removendo..." : "Remover"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
