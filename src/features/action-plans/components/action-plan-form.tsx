"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  createActionPlanAction,
  updateActionPlanAction,
} from "../actions/action-plan-actions";
import {
  actionPlanPriorityLabels,
  actionPlanPriorityOptions,
  actionPlanSchema,
  actionPlanStatusLabels,
  actionPlanStatusOptions,
  type ActionPlanFormValues,
} from "../schemas/action-plan-schema";
import type {
  ActionPlanNonConformityOption,
  ActionPlanUserOption,
} from "../services/action-plan-service";
import { ActionPlanExtraFields } from "./action-plan-extra-fields";

type ActionPlanFormProps = {
  cancelHref: string;
  fixedNonConformity?: NonNullable<ActionPlanNonConformityOption>;
  id?: string;
  initialValues?: ActionPlanFormValues;
  mode: "create" | "edit";
  returnTo?: string;
  userOptions: ActionPlanUserOption[];
};

const defaultValues: ActionPlanFormValues = {
  nonConformityId: "",
  responsibleId: "",
  title: "",
  description: "",
  status: "OPEN",
  priority: "MEDIUM",
  dueDate: "",
  notes: "",
  extraFields: [],
};

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null;
}

function dateValue(date?: Date | null) {
  return date ? new Date(date).toISOString().slice(0, 10) : "";
}

function linkedChecklistItems(
  nonConformity?: NonNullable<ActionPlanNonConformityOption>,
) {
  if (!nonConformity) {
    return [];
  }

  const items = [
    ...(nonConformity.auditChecklistItem ? [nonConformity.auditChecklistItem] : []),
    ...nonConformity.checklistItemLinks.map((link) => link.auditChecklistItem),
  ];

  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

function buildSuggestedValues(
  nonConformity?: NonNullable<ActionPlanNonConformityOption>,
) {
  if (!nonConformity) {
    return null;
  }

  const items = linkedChecklistItems(nonConformity);
  const checklistLines = items.map((item) => {
    return `- ${item.auditChecklist.checklistName} | ${item.order}. ${item.question}`;
  });

  const title = `Plano de acao - ${nonConformity.title}`;
  const descriptionParts = [
    `NC de origem: ${nonConformity.title}`,
    `Empresa: ${nonConformity.audit.company.name}`,
    `Auditoria: ${nonConformity.audit.title}`,
    nonConformity.description ? `Descricao da NC: ${nonConformity.description}` : "",
    checklistLines.length > 0
      ? ["Itens do checklist relacionados:", ...checklistLines].join("\n")
      : "",
  ].filter(Boolean);

  const noteParts = [
    nonConformity.correctionDeadline
      ? `Prazo sugerido da NC: ${dateValue(nonConformity.correctionDeadline)}`
      : "",
    nonConformity.correctionNotes
      ? `Orientacoes da NC: ${nonConformity.correctionNotes}`
      : "",
  ].filter(Boolean);

  return {
    description: descriptionParts.join("\n\n"),
    notes: noteParts.join("\n\n"),
    priority: nonConformity.severity,
    title,
  };
}

export function ActionPlanForm({
  cancelHref,
  fixedNonConformity,
  id,
  initialValues,
  mode,
  returnTo,
  userOptions,
}: ActionPlanFormProps) {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEdit = mode === "edit";
  const suggestedValues = useMemo(
    () => buildSuggestedValues(fixedNonConformity),
    [fixedNonConformity],
  );
  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<ActionPlanFormValues>({
    resolver: zodResolver(actionPlanSchema) as Resolver<ActionPlanFormValues>,
    defaultValues:
      initialValues ??
      {
        ...defaultValues,
        nonConformityId: fixedNonConformity?.id ?? "",
        title: suggestedValues?.title ?? "",
        description: suggestedValues?.description ?? "",
        notes: suggestedValues?.notes ?? "",
        priority: suggestedValues?.priority ?? defaultValues.priority,
      },
  });

  useEffect(() => {
    if (!fixedNonConformity || isEdit) {
      return;
    }

    setValue("nonConformityId", fixedNonConformity.id);

    if (suggestedValues) {
      setValue("title", suggestedValues.title);
      setValue("description", suggestedValues.description);
      setValue("notes", suggestedValues.notes);
      setValue("priority", suggestedValues.priority);
    }
  }, [fixedNonConformity, isEdit, setValue, suggestedValues]);

  function onSubmit(values: ActionPlanFormValues) {
    if (isPending || hasSubmitted) return;

    setHasSubmitted(true);
    startTransition(async () => {
      const result =
        isEdit && id
          ? await updateActionPlanAction({ id, values, returnTo })
          : await createActionPlanAction(values, returnTo);

      if (!result) return;

      setHasSubmitted(false);

      if (result.error) setError("root", { message: result.error });

      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        if (message) setError(field as keyof ActionPlanFormValues, { message });
      }
    });
  }

  const submitDisabled = isPending || hasSubmitted;
  const ncChecklistItems = linkedChecklistItems(fixedNonConformity);

  return (
    <form
      className="space-y-5 rounded-lg border bg-card p-4 shadow-sm sm:p-6"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="nonConformityId">Nao conformidade</Label>
          <input type="hidden" {...register("nonConformityId")} />
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
            {fixedNonConformity
              ? `${fixedNonConformity.audit.company.name} - ${fixedNonConformity.title}`
              : "Nao conformidade vinculada"}
          </div>
          <FieldError message={errors.nonConformityId?.message} />
        </div>

        {fixedNonConformity ? (
          <div className="space-y-2 md:col-span-2">
            <Label>Contexto trazido da checklist/NC</Label>
            <div className="rounded-md border bg-background p-4 text-sm">
              <p>
                <strong>Auditoria:</strong> {fixedNonConformity.audit.title}
              </p>
              <p className="mt-1">
                <strong>Severidade da NC:</strong> {fixedNonConformity.severity}
              </p>
              {ncChecklistItems.length > 0 ? (
                <div className="mt-3 space-y-1">
                  <p className="font-medium">Itens relacionados:</p>
                  {ncChecklistItems.map((item) => (
                    <p className="text-muted-foreground" key={item.id}>
                      {item.auditChecklist.checklistName} - {item.order}. {item.question}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="title">Titulo</Label>
          <Input id="title" aria-invalid={Boolean(errors.title)} {...register("title")} />
          <FieldError message={errors.title?.message} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Descricao</Label>
          <Textarea
            id="description"
            aria-invalid={Boolean(errors.description)}
            {...register("description")}
          />
          <FieldError message={errors.description?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            className={cn("h-10 w-full rounded-lg border border-input bg-background px-3 text-sm")}
            id="status"
            {...register("status")}
          >
            {actionPlanStatusOptions.map((status) => (
              <option key={status} value={status}>
                {actionPlanStatusLabels[status]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Prioridade</Label>
          <select
            className={cn("h-10 w-full rounded-lg border border-input bg-background px-3 text-sm")}
            id="priority"
            {...register("priority")}
          >
            {actionPlanPriorityOptions.map((priority) => (
              <option key={priority} value={priority}>
                {actionPlanPriorityLabels[priority]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsibleId">Responsavel</Label>
          <select
            className={cn("h-10 w-full rounded-lg border border-input bg-background px-3 text-sm")}
            id="responsibleId"
            {...register("responsibleId")}
          >
            <option value="">Sem responsavel</option>
            {userOptions.map(({ user }) => (
              <option key={user.id} value={user.id}>
                {user.name ?? user.email}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueDate">Prazo</Label>
          <Input id="dueDate" type="date" {...register("dueDate")} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Observacoes</Label>
          <Textarea id="notes" aria-invalid={Boolean(errors.notes)} {...register("notes")} />
          <FieldError message={errors.notes?.message} />
        </div>
      </div>

      <ActionPlanExtraFields
        control={control}
        errors={errors}
        register={register}
      />

      {errors.root ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errors.root.message}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button asChild className="w-full sm:w-auto" type="button" variant="outline">
          <Link href={cancelHref}>Cancelar</Link>
        </Button>
        <Button className="w-full sm:w-auto" disabled={submitDisabled} type="submit">
          {submitDisabled
            ? "Salvando..."
            : isEdit
              ? "Salvar alteracoes"
              : "Criar plano"}
        </Button>
      </div>
    </form>
  );
}
