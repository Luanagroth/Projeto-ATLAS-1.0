"use client";

import { Link2, NotebookPen, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type ChangeEvent, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { checklistItemTypeLabels } from "@/features/checklists/schemas/checklist-schema";

import {
  saveAuditChecklistResponsesAction,
  uploadChecklistEvidenceAction,
} from "../actions/audit-checklist-actions";
import type { AuditChecklistExecution } from "../services/audit-checklist-service";

type AppliedChecklist = AuditChecklistExecution[number];

type ChecklistExecutionFormProps = {
  auditId: string;
  checklist: AppliedChecklist;
  canRespond: boolean;
};

function optionsFromJson(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.filter((option): option is string => {
    return typeof option === "string" && option.trim().length > 0;
  });
}

function initialAnswer(item: AppliedChecklist["items"][number]) {
  const response = item.responses[0];

  if (!response) return "";

  if (item.type === "SIM_NAO" || item.type === "MULTIPLA_ESCOLHA") {
    return response.answerChoice ?? "";
  }

  if (item.type === "TEXTO") return response.answerText ?? "";
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

  return "";
}

function initialCompliance(item: AppliedChecklist["items"][number]) {
  const value = item.responses[0]?.answerBoolean;

  if (typeof value !== "boolean") return "" as const;

  return value ? ("true" as const) : ("false" as const);
}

function visibilityLabel(value: "INTERNAL" | "SHARED") {
  return value === "SHARED"
    ? "Visivel para auditora e empresa"
    : "Visivel apenas para a auditora";
}

export function ChecklistExecutionForm({
  auditId,
  canRespond,
  checklist,
}: ChecklistExecutionFormProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState(() => {
    return Object.fromEntries(
      checklist.items.map((item) => [item.id, initialAnswer(item)]),
    );
  });

  const [compliance, setCompliance] = useState(() => {
    return Object.fromEntries(
      checklist.items.map((item) => [item.id, initialCompliance(item)]),
    ) as Record<string, "true" | "false" | "">;
  });

  const [notes, setNotes] = useState(() => {
    return Object.fromEntries(
      checklist.items.map((item) => [item.id, item.responses[0]?.notes ?? ""]),
    );
  });

  const [evidences, setEvidences] = useState(() => {
    return Object.fromEntries(
      checklist.items.map((item) => [item.id, item.responses[0]?.evidence ?? ""]),
    );
  });

  const [auditorNote, setAuditorNote] = useState(checklist.auditorNote ?? "");
  const [auditorNoteVisibility, setAuditorNoteVisibility] = useState<
    "INTERNAL" | "SHARED"
  >(checklist.auditorNoteVisibility);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [uploadMessages, setUploadMessages] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  function setUploadMessage(itemId: string, value: string) {
    setUploadMessages((current) => ({
      ...current,
      [itemId]: value,
    }));
  }

  function onPickFile(itemId: string) {
    fileInputsRef.current[itemId]?.click();
  }

  function onFileChange(
    itemId: string,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadMessage(itemId, "");
    setUploadingItemId(itemId);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("auditId", auditId);
      formData.set("auditChecklistItemId", itemId);
      formData.set("file", file);

      const result = await uploadChecklistEvidenceAction(formData);

      if (result.error) {
        setUploadMessage(itemId, result.error);
        setUploadingItemId(null);
        event.target.value = "";
        return;
      }

      const uploadedUrl = result.url;

      if (uploadedUrl) {
        setEvidences((current) => ({
          ...current,
          [itemId]: uploadedUrl,
        }));
      }

      setUploadMessage(
        itemId,
        result.success ?? "Arquivo enviado e vinculado a evidencia.",
      );
      setUploadingItemId(null);
      event.target.value = "";
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await saveAuditChecklistResponsesAction({
        auditId,
        auditChecklistId: checklist.id,
        auditorNote,
        auditorNoteVisibility,
        responses: checklist.items.map((item) => ({
          auditChecklistItemId: item.id,
          type: item.type,
          answerValue: answers[item.id] ?? "",
          isCompliant: compliance[item.id] || undefined,
          evidence: evidences[item.id] ?? "",
          notes: notes[item.id] ?? "",
        })),
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage(
        "Checklist salvo. Itens nao conformes seguem para a pre-analise de NC.",
      );
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <p className="rounded-md border border-dashed bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        Cada item pode registrar a resposta atual, o status de conformidade, um
        anexo opcional e observacoes da auditora.
      </p>

      {checklist.items.map((item) => {
        const options = optionsFromJson(item.options);

        return (
          <div className="rounded-md border bg-background p-4" key={item.id}>
            <div className="space-y-4">
              <div>
                <Label htmlFor={item.id}>
                  {item.order}. {item.question}
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  {checklistItemTypeLabels[item.type]}
                  {item.isRequired ? " - Obrigatorio" : " - Opcional"}
                </p>
                {item.description ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.description}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={item.id}>Resposta atual</Label>

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
                      <option value="true">Verdadeiro / Sim</option>
                      <option value="false">Falso / Nao</option>
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
                      placeholder="Descreva a situacao atual deste item"
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
                      placeholder="Informe o valor atual"
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

                <div className="space-y-2">
                  <Label>Status do item</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[ 
                      { label: "Conforme", value: "true" as const },
                      { label: "Nao conforme", value: "false" as const },
                    ].map((option) => {
                      const selected = compliance[item.id] === option.value;

                      return (
                        <button
                          className={`rounded-md border px-3 py-2 text-left text-sm font-medium transition ${
                            selected
                              ? option.value === "true"
                                ? "border-emerald-600 bg-emerald-500/10 text-emerald-700"
                                : "border-destructive bg-destructive/10 text-destructive"
                              : "bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          }`}
                          disabled={!canRespond || isPending}
                          key={option.value}
                          onClick={() =>
                            setCompliance((current) => ({
                              ...current,
                              [item.id]: option.value,
                            }))
                          }
                          type="button"
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Itens nao conformes vao automaticamente para a pre-analise de NC.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`${item.id}-evidence`}>
                    <span className="inline-flex items-center gap-1">
                      <Link2 className="size-3.5" />
                      Anexo ou link da evidencia
                    </span>
                  </Label>
                  <Input
                    disabled={!canRespond || isPending}
                    id={`${item.id}-evidence`}
                    onChange={(event) =>
                      setEvidences((current) => ({
                        ...current,
                        [item.id]: event.target.value,
                      }))
                    }
                    placeholder="Cole a URL/caminho do arquivo, foto, video, PDF ou print"
                    value={evidences[item.id] ?? ""}
                  />
                  {canRespond ? (
                    <>
                      <input
                        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                        className="hidden"
                        onChange={(event) => onFileChange(item.id, event)}
                        ref={(element) => {
                          fileInputsRef.current[item.id] = element;
                        }}
                        type="file"
                      />
                      <Button
                        disabled={isPending || uploadingItemId === item.id}
                        onClick={() => onPickFile(item.id)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Upload className="size-4" />
                        {uploadingItemId === item.id
                          ? "Carregando arquivo..."
                          : "Carregar do computador"}
                      </Button>
                    </>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    Voce pode colar um link ou selecionar um arquivo do desktop/pastas locais.
                  </p>
                  {uploadMessages[item.id] ? (
                    <p className="text-xs text-muted-foreground">
                      {uploadMessages[item.id]}
                    </p>
                  ) : null}
                  {item.responses[0]?.evidence ? (
                    <a
                      className="text-xs font-medium text-primary hover:underline"
                      href={item.responses[0].evidence}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Abrir anexo atual
                    </a>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${item.id}-notes`}>Descricao ou observacao</Label>
                  <Textarea
                    disabled={!canRespond || isPending}
                    id={`${item.id}-notes`}
                    onChange={(event) =>
                      setNotes((current) => ({
                        ...current,
                        [item.id]: event.target.value,
                      }))
                    }
                    placeholder="Contexto da analise, incoerencias e comentarios"
                    value={notes[item.id] ?? ""}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="rounded-md border bg-background p-4">
        <div className="mb-3 flex items-center gap-2">
          <NotebookPen className="size-4 text-muted-foreground" />
          <div>
            <h4 className="text-sm font-semibold">Nota da auditora</h4>
            <p className="text-xs text-muted-foreground">
              Observacoes gerais, lembretes e conclusoes parciais deste checklist.
            </p>
          </div>
        </div>

        {canRespond || checklist.auditorNote ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor={`auditor-note-${checklist.id}`}>Nota</Label>
              <Textarea
                disabled={!canRespond || isPending}
                id={`auditor-note-${checklist.id}`}
                onChange={(event) => setAuditorNote(event.target.value)}
                placeholder="Escreva uma nota geral da auditora para este checklist"
                value={auditorNote}
              />
            </div>

            {canRespond ? (
              <div className="space-y-2">
                <Label htmlFor={`auditor-note-visibility-${checklist.id}`}>
                  Visibilidade
                </Label>
                <select
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  disabled={isPending}
                  id={`auditor-note-visibility-${checklist.id}`}
                  onChange={(event) =>
                    setAuditorNoteVisibility(
                      event.target.value as "INTERNAL" | "SHARED",
                    )
                  }
                  value={auditorNoteVisibility}
                >
                  <option value="INTERNAL">Apenas auditora</option>
                  <option value="SHARED">Auditora e empresa</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  {visibilityLabel(auditorNoteVisibility)}
                </p>
              </div>
            ) : checklist.auditorNoteVisibility === "SHARED" && checklist.auditorNote ? (
              <p className="text-xs text-muted-foreground">
                {visibilityLabel(checklist.auditorNoteVisibility)}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      {canRespond ? (
        <Button disabled={isPending} type="submit">
          {isPending ? "Salvando..." : "Salvar checklist"}
        </Button>
      ) : null}
    </form>
  );
}
