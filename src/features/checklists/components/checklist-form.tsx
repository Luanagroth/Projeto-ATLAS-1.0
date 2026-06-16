"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  createChecklistAction,
  updateChecklistAction,
} from "../actions/checklist-actions";
import {
  checklistSchema,
  type ChecklistFormValues,
} from "../schemas/checklist-schema";
import { ChecklistItemsFields } from "./checklist-items-fields";

type ChecklistFormProps = {
  cancelHref: string;
  checklistId?: string;
  initialValues?: ChecklistFormValues;
  mode: "create" | "edit";
  returnTo?: string;
};

const defaultValues: ChecklistFormValues = {
  name: "",
  description: "",
  category: "",
  isActive: true,
  items: [
    {
      question: "",
      type: "SIM_NAO",
      isRequired: true,
      options: [],
    },
  ],
};

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null;
}

export function ChecklistForm({
  cancelHref,
  checklistId,
  initialValues,
  mode,
  returnTo,
}: ChecklistFormProps) {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEdit = mode === "edit";
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ChecklistFormValues>({
    resolver: zodResolver(checklistSchema) as Resolver<ChecklistFormValues>,
    defaultValues: initialValues ?? defaultValues,
  });

  function onSubmit(values: ChecklistFormValues) {
    if (isPending || hasSubmitted) {
      return;
    }

    setHasSubmitted(true);

    startTransition(async () => {
      const result =
        isEdit && checklistId
          ? await updateChecklistAction({ checklistId, values })
          : await createChecklistAction(values, returnTo);

      if (!result) {
        return;
      }

      setHasSubmitted(false);

      if (result.error) {
        setError("root", { message: result.error });
      }

      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        if (message) {
          setError(field as keyof ChecklistFormValues, { message });
        }
      }
    });
  }

  const submitDisabled = isPending || hasSubmitted;

  return (
    <form
      className="space-y-6 rounded-lg border bg-card p-4 shadow-sm sm:p-6"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Dados do modelo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Identifique o modelo para reutilizacao em auditorias futuras.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Input
              id="category"
              aria-invalid={Boolean(errors.category)}
              {...register("category")}
            />
            <FieldError message={errors.category?.message} />
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
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input className="size-4" type="checkbox" {...register("isActive")} />
          Modelo ativo
        </label>
      </section>

      <ChecklistItemsFields
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
              : "Criar modelo"}
        </Button>
      </div>
    </form>
  );
}
