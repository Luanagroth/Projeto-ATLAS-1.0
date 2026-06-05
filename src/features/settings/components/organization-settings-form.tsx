"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { updateOrganizationSettingsAction } from "../actions/settings-actions";
import {
  organizationSettingsSchema,
  type OrganizationSettingsValues,
} from "../schemas/settings-schema";
import type { SettingsOrganization } from "../services/settings-service";

type OrganizationSettingsFormProps = {
  canEdit: boolean;
  organization: SettingsOrganization;
};

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null;
}

export function OrganizationSettingsForm({
  canEdit,
  organization,
}: OrganizationSettingsFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<OrganizationSettingsValues>({
    resolver: zodResolver(organizationSettingsSchema) as Resolver<OrganizationSettingsValues>,
    defaultValues: {
      name: organization.name,
      description: organization.description ?? "",
      logo: organization.logo ?? "",
      phone: organization.phone ?? "",
      email: organization.email ?? "",
      address: organization.address ?? "",
    },
  });

  function onSubmit(values: OrganizationSettingsValues) {
    if (!canEdit || isPending) return;

    setMessage(null);
    startTransition(async () => {
      const result = await updateOrganizationSettingsAction(values);

      if (result.success) {
        setMessage(result.success);
      }

      if (result.error) {
        setError("root", { message: result.error });
      }

      for (const [field, fieldMessage] of Object.entries(result.fieldErrors ?? {})) {
        if (fieldMessage) {
          setError(field as keyof OrganizationSettingsValues, {
            message: fieldMessage,
          });
        }
      }
    });
  }

  return (
    <form className="rounded-lg border bg-card p-5 shadow-sm" noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="flex items-center gap-2">
        <Building2 className="size-5 text-muted-foreground" />
        <h2 className="text-base font-semibold">Dados da organização</h2>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            disabled={!canEdit}
            id="name"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          <FieldError message={errors.name?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input disabled={!canEdit} id="email" type="email" {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input disabled={!canEdit} id="phone" {...register("phone")} />
          <FieldError message={errors.phone?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo">Logo</Label>
          <Input disabled={!canEdit} id="logo" {...register("logo")} />
          <p className="text-xs text-muted-foreground">
            Informe uma URL por enquanto. Upload de arquivo será implementado na
            etapa de anexos/uploads. Logo futuro deve ser PNG, JPG ou SVG; PDF
            será usado apenas para documentos e anexos.
          </p>
          <FieldError message={errors.logo?.message} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Endereco</Label>
          <Input disabled={!canEdit} id="address" {...register("address")} />
          <FieldError message={errors.address?.message} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            disabled={!canEdit}
            id="description"
            aria-invalid={Boolean(errors.description)}
            {...register("description")}
          />
          <FieldError message={errors.description?.message} />
        </div>
      </div>

      {errors.root ? (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errors.root.message}
        </p>
      ) : null}
      {message ? (
        <p className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      <div className="mt-5 flex justify-end">
        <Button disabled={!canEdit || isPending} type="submit">
          <Save />
          {isPending ? "Salvando..." : "Salvar organização"}
        </Button>
      </div>
    </form>
  );
}
