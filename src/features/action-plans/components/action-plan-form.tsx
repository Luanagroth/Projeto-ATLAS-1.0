"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
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

type ActionPlanFormProps = {
  cancelHref: string;
  fixedNonConformity?: NonNullable<ActionPlanNonConformityOption>;
  id?: string;
  initialValues?: ActionPlanFormValues;
  mode: "create" | "edit";
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
};

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null;
}

export function ActionPlanForm({
  cancelHref,
  fixedNonConformity,
  id,
  initialValues,
  mode,
  userOptions,
}: ActionPlanFormProps) {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEdit = mode === "edit";
  const {
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
      },
  });

  useEffect(() => {
    if (fixedNonConformity) {
      setValue("nonConformityId", fixedNonConformity.id);
    }
  }, [fixedNonConformity, setValue]);

  function onSubmit(values: ActionPlanFormValues) {
    if (isPending || hasSubmitted) return;

    setHasSubmitted(true);
    startTransition(async () => {
      const result =
        isEdit && id
          ? await updateActionPlanAction({ id, values })
          : await createActionPlanAction(values);

      if (!result) return;

      setHasSubmitted(false);

      if (result.error) setError("root", { message: result.error });

      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        if (message) setError(field as keyof ActionPlanFormValues, { message });
      }
    });
  }

  const submitDisabled = isPending || hasSubmitted;

  return (
    <form
      className="space-y-5 rounded-lg border bg-card p-6 shadow-sm"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="nonConformityId">Não conformidade</Label>
          <input type="hidden" {...register("nonConformityId")} />
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
            {fixedNonConformity
              ? `${fixedNonConformity.audit.company.name} - ${fixedNonConformity.title}`
              : "Não conformidade vinculada"}
          </div>
          <FieldError message={errors.nonConformityId?.message} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Titulo</Label>
          <Input id="title" aria-invalid={Boolean(errors.title)} {...register("title")} />
          <FieldError message={errors.title?.message} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Descrição</Label>
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

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Observacoes</Label>
          <Textarea id="notes" aria-invalid={Boolean(errors.notes)} {...register("notes")} />
          <FieldError message={errors.notes?.message} />
        </div>
      </div>

      {errors.root ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errors.root.message}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button asChild type="button" variant="outline">
          <Link href={cancelHref}>Cancelar</Link>
        </Button>
        <Button disabled={submitDisabled} type="submit">
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
