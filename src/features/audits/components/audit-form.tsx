"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { createAuditAction } from "../actions/audit-actions";
import {
  auditSchema,
  type AuditFormValues,
} from "../schemas/audit-schema";
import type { AuditCompanyOption } from "../services/audit-service";

type AuditFormProps = {
  companies: AuditCompanyOption[];
  initialCompanyId?: string;
};

const defaultValues: AuditFormValues = {
  companyId: "",
  title: "",
  status: "IN_PROGRESS",
  description: "",
  startDate: "",
  dueDate: "",
};

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null;
}

export function AuditForm({ companies, initialCompanyId }: AuditFormProps) {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AuditFormValues>({
    resolver: zodResolver(auditSchema) as Resolver<AuditFormValues>,
    defaultValues: {
      ...defaultValues,
      companyId: initialCompanyId ?? defaultValues.companyId,
    },
  });

  function onSubmit(values: AuditFormValues) {
    if (isPending || hasSubmitted) {
      return;
    }

    setHasSubmitted(true);

    startTransition(async () => {
      const result = await createAuditAction(values);

      if (!result) {
        return;
      }

      setHasSubmitted(false);

      if (result.error) {
        setError("root", { message: result.error });
      }

      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        if (message) {
          setError(field as keyof AuditFormValues, { message });
        }
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
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="companyId">Empresa</Label>
          <select
            id="companyId"
            className={cn(
              "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            )}
            aria-invalid={Boolean(errors.companyId)}
            {...register("companyId")}
          >
            <option value="">Selecione uma empresa</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
                {company.cnpj ? ` - ${company.cnpj}` : ""}
              </option>
            ))}
          </select>
          <FieldError message={errors.companyId?.message} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="title">Titulo</Label>
          <Input
            id="title"
            aria-invalid={Boolean(errors.title)}
            {...register("title")}
          />
          <FieldError message={errors.title?.message} />
        </div>

        <input type="hidden" value="IN_PROGRESS" {...register("status")} />

        <div className="space-y-2">
          <Label htmlFor="startDate">Data de inicio</Label>
          <Input
            id="startDate"
            type="date"
            aria-invalid={Boolean(errors.startDate)}
            {...register("startDate")}
          />
          <FieldError message={errors.startDate?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueDate">Prazo</Label>
          <Input
            id="dueDate"
            type="date"
            aria-invalid={Boolean(errors.dueDate)}
            {...register("dueDate")}
          />
          <FieldError message={errors.dueDate?.message} />
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

      {errors.root ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errors.root.message}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button asChild className="w-full sm:w-auto" type="button" variant="outline">
          <Link href="/audits">Cancelar</Link>
        </Button>
        <Button className="w-full sm:w-auto" disabled={submitDisabled} type="submit">
          {submitDisabled ? "Salvando..." : "Criar auditoria"}
        </Button>
      </div>
    </form>
  );
}
