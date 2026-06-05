"use client";

import { Plus, Trash2 } from "lucide-react";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { useFieldArray, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import {
  checklistItemTypeLabels,
  checklistItemTypes,
  type ChecklistFormValues,
} from "../schemas/checklist-schema";

type ChecklistItemsFieldsProps = {
  control: Control<ChecklistFormValues>;
  errors: FieldErrors<ChecklistFormValues>;
  register: UseFormRegister<ChecklistFormValues>;
};

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null;
}

export function ChecklistItemsFields({
  control,
  errors,
  register,
}: ChecklistItemsFieldsProps) {
  const { append, fields, remove } = useFieldArray({
    control,
    name: "items",
  });
  const watchedItems = useWatch({ control, name: "items" });

  return (
    <section className="space-y-4 border-t pt-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Itens do modelo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Defina as perguntas que serão reutilizadas nas auditorias.
          </p>
        </div>
        <Button
          onClick={() =>
            append({
              question: "",
              type: "SIM_NAO",
              isRequired: true,
              options: [],
            })
          }
          type="button"
          variant="outline"
        >
          <Plus />
          Adicionar item
        </Button>
      </div>

      <FieldError message={errors.items?.message} />

      <div className="space-y-3">
        {fields.map((field, index) => {
          const type = watchedItems?.[index]?.type;

          return (
            <div className="rounded-md border bg-background p-4" key={field.id}>
              <div className="grid gap-4 sm:grid-cols-[1fr_12rem_auto]">
                <div className="space-y-2">
                  <Label htmlFor={`items.${index}.question`}>Pergunta</Label>
                  <Input
                    id={`items.${index}.question`}
                    aria-invalid={Boolean(errors.items?.[index]?.question)}
                    {...register(`items.${index}.question`)}
                  />
                  <FieldError message={errors.items?.[index]?.question?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`items.${index}.type`}>Tipo</Label>
                  <select
                    id={`items.${index}.type`}
                    className={cn(
                      "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors",
                      "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                    )}
                    aria-invalid={Boolean(errors.items?.[index]?.type)}
                    {...register(`items.${index}.type`)}
                  >
                    {checklistItemTypes.map((itemType) => (
                      <option key={itemType} value={itemType}>
                        {checklistItemTypeLabels[itemType]}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors.items?.[index]?.type?.message} />
                </div>

                <Button
                  aria-label="Remover item"
                  className="self-end"
                  onClick={() => remove(index)}
                  type="button"
                  variant="outline"
                >
                  <Trash2 />
                </Button>
              </div>

              <label className="mt-4 flex items-center gap-2 text-sm">
                <input
                  className="size-4"
                  type="checkbox"
                  {...register(`items.${index}.isRequired`)}
                />
                Obrigatorio
              </label>

              {type === "MULTIPLA_ESCOLHA" ? (
                <div className="mt-4 space-y-2">
                  <Label htmlFor={`items.${index}.options`}>
                    Opcoes de multipla escolha
                  </Label>
                  <Input
                    id={`items.${index}.options`}
                    placeholder="Baixo, Medio, Alto"
                    aria-invalid={Boolean(errors.items?.[index]?.options)}
                    {...register(`items.${index}.options`, {
                      setValueAs: (value) =>
                        typeof value === "string"
                          ? value.split(",").map((option) => option.trim())
                          : [],
                    })}
                  />
                  <FieldError
                    message={
                      Array.isArray(errors.items?.[index]?.options)
                        ? undefined
                        : errors.items?.[index]?.options?.message
                    }
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
