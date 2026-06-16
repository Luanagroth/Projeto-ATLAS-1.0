"use client";

import { Plus, Trash2 } from "lucide-react";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { useFieldArray } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { CompanyFormValues } from "../schemas/company-schema";

type CompanyExtraFieldsProps = {
  control: Control<CompanyFormValues>;
  errors: FieldErrors<CompanyFormValues>;
  register: UseFormRegister<CompanyFormValues>;
};

export function CompanyExtraFields({
  control,
  errors,
  register,
}: CompanyExtraFieldsProps) {
  const { append, fields, remove } = useFieldArray({
    control,
    name: "extraFields",
  });

  return (
    <section className="space-y-4 border-t pt-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Informacoes adicionais</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Adicione campos específicos do ramo ou da operação da empresa.
          </p>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => append({ key: "", value: "" })}
          type="button"
          variant="outline"
        >
          <Plus />
          Adicionar campo
        </Button>
      </div>

      {fields.length > 0 ? (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              className="grid gap-3 rounded-md border bg-background p-4 lg:grid-cols-[1fr_1fr_auto]"
              key={field.id}
            >
              <div className="space-y-2">
                <Label htmlFor={`extraFields.${index}.key`}>
                  Nome do campo
                </Label>
                <Input
                  id={`extraFields.${index}.key`}
                  aria-invalid={Boolean(errors.extraFields?.[index]?.key)}
                  {...register(`extraFields.${index}.key`)}
                />
                {errors.extraFields?.[index]?.key ? (
                  <p className="text-sm text-destructive">
                    {errors.extraFields[index]?.key?.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`extraFields.${index}.value`}>Valor</Label>
                <Input
                  id={`extraFields.${index}.value`}
                  aria-invalid={Boolean(errors.extraFields?.[index]?.value)}
                  {...register(`extraFields.${index}.value`)}
                />
                {errors.extraFields?.[index]?.value ? (
                  <p className="text-sm text-destructive">
                    {errors.extraFields[index]?.value?.message}
                  </p>
                ) : null}
              </div>

              <Button
                aria-label="Remover campo adicional"
                className="self-end w-full lg:w-auto"
                onClick={() => remove(index)}
                type="button"
                variant="outline"
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground">
          Nenhuma informação adicional cadastrada.
        </p>
      )}
    </section>
  );
}
