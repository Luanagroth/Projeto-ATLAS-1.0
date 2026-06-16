"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  createNonConformityAction,
  updateNonConformityAction,
} from "../actions/non-conformity-actions";
import {
  nonConformitySchema,
  severityLabels,
  severityOptions,
  statusLabels,
  statusOptions,
  type NonConformityFormValues,
} from "../schemas/non-conformity-schema";
import type {
  NonConformityAuditOption,
  NonConformityChecklistItemOption,
} from "../services/non-conformity-service";

type UserOption = {
  user: { email: string; id: string; name: string | null };
};

type NonConformityFormProps = {
  auditOptions: NonConformityAuditOption[];
  cancelHref: string;
  checklistItemsByAudit: Record<string, NonConformityChecklistItemOption[]>;
  fixedAuditId?: string;
  id?: string;
  initialValues?: NonConformityFormValues;
  mode: "create" | "edit";
  returnTo?: string;
  userOptions: UserOption[];
};

const defaultValues: NonConformityFormValues = {
  auditId: "",
  auditChecklistItemId: "",
  auditChecklistItemIds: [],
  responsibleId: "",
  title: "",
  description: "",
  severity: "MEDIUM",
  status: "OPEN",
  correctionDeadline: "",
  correctionNotes: "",
};

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null;
}

export function NonConformityForm({
  auditOptions,
  cancelHref,
  checklistItemsByAudit,
  fixedAuditId,
  id,
  initialValues,
  mode,
  returnTo,
  userOptions,
}: NonConformityFormProps) {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEdit = mode === "edit";
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors },
  } = useForm<NonConformityFormValues>({
    resolver: zodResolver(nonConformitySchema) as Resolver<NonConformityFormValues>,
    defaultValues: initialValues ?? { ...defaultValues, auditId: fixedAuditId ?? "" },
  });
  const selectedAuditId = useWatch({ control, name: "auditId" });
  const checklistItems = checklistItemsByAudit[selectedAuditId] ?? [];
  const linkedChecklistItemIds =
    useWatch({ control, name: "auditChecklistItemIds" }) ?? [];

  useEffect(() => {
    if (fixedAuditId) {
      setValue("auditId", fixedAuditId);
    }
  }, [fixedAuditId, setValue]);

  function onSubmit(values: NonConformityFormValues) {
    if (isPending || hasSubmitted) return;

    setHasSubmitted(true);
    startTransition(async () => {
      const result =
        isEdit && id
          ? await updateNonConformityAction({ id, values, returnTo })
          : await createNonConformityAction(values, returnTo);

      if (!result) return;

      setHasSubmitted(false);

      if (result.error) setError("root", { message: result.error });

      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        if (message) setError(field as keyof NonConformityFormValues, { message });
      }
    });
  }

  const submitDisabled = isPending || hasSubmitted;

  return (
    <form
      className="space-y-5 rounded-lg border bg-card p-4 shadow-sm sm:p-6"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid gap-5 md:grid-cols-2">
        {linkedChecklistItemIds.map((itemId, index) => (
          <input
            key={`${itemId}-${index}`}
            type="hidden"
            {...register(`auditChecklistItemIds.${index}`)}
          />
        ))}

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="auditId">Auditoria</Label>
          <select
            id="auditId"
            className={cn("h-10 w-full rounded-lg border border-input bg-background px-3 text-sm")}
            disabled={Boolean(fixedAuditId)}
            {...register("auditId")}
          >
            <option value="">Selecione uma auditoria</option>
            {auditOptions.map((audit) => (
              <option key={audit.id} value={audit.id}>
                {audit.company.name} - {audit.title}
              </option>
            ))}
          </select>
          <FieldError message={errors.auditId?.message} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="auditChecklistItemId">Item do checklist</Label>
          <select
            id="auditChecklistItemId"
            className={cn("h-10 w-full rounded-lg border border-input bg-background px-3 text-sm")}
            {...register("auditChecklistItemId")}
          >
            <option value="">Sem item vinculado</option>
            {checklistItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.auditChecklist.checklistName} - {item.question}
              </option>
            ))}
          </select>
        </div>

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
          <Label htmlFor="severity">Criticidade</Label>
          <select
            id="severity"
            className={cn("h-10 w-full rounded-lg border border-input bg-background px-3 text-sm")}
            {...register("severity")}
          >
            {severityOptions.map((severity) => (
              <option key={severity} value={severity}>
                {severityLabels[severity]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            className={cn("h-10 w-full rounded-lg border border-input bg-background px-3 text-sm")}
            {...register("status")}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsibleId">Responsavel</Label>
          <select
            id="responsibleId"
            className={cn("h-10 w-full rounded-lg border border-input bg-background px-3 text-sm")}
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
          <Label htmlFor="correctionDeadline">Prazo</Label>
          <Input id="correctionDeadline" type="date" {...register("correctionDeadline")} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="correctionNotes">Observacoes</Label>
          <Textarea id="correctionNotes" {...register("correctionNotes")} />
          <FieldError message={errors.correctionNotes?.message} />
        </div>
      </div>

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
          {submitDisabled ? "Salvando..." : isEdit ? "Salvar alteracoes" : "Criar nao conformidade"}
        </Button>
      </div>
    </form>
  );
}
