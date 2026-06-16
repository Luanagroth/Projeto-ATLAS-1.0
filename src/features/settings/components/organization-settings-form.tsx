"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Save } from "lucide-react";
import Image from "next/image";
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
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(organization.logo ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<OrganizationSettingsValues>({
    resolver: zodResolver(
      organizationSettingsSchema,
    ) as Resolver<OrganizationSettingsValues>,
    defaultValues: {
      name: organization.name,
      description: organization.description ?? "",
      cnpj: organization.cnpj ?? "",
      phone: organization.phone ?? "",
      email: organization.email ?? "",
      address: organization.address ?? "",
    },
  });

  function onSubmit(values: OrganizationSettingsValues) {
    if (!canEdit || isPending) return;

    setLogoError(null);
    setMessage(null);

    startTransition(async () => {
      const formData = new FormData();

      formData.append("name", values.name);
      formData.append("description", values.description ?? "");
      formData.append("cnpj", values.cnpj ?? "");
      formData.append("phone", values.phone ?? "");
      formData.append("email", values.email ?? "");
      formData.append("address", values.address ?? "");

      if (logoFile) {
        formData.append("logoFile", logoFile);
      }

      const result = await updateOrganizationSettingsAction(formData);

      if (result.success) {
        setMessage(result.success);
      }

      if (result.logoError) {
        setLogoError(result.logoError);
      }

      if (result.logoUrl) {
        setLogoUrl(result.logoUrl);
      }

      if (result.error) {
        setError("root", { message: result.error });
      }

      for (const [field, fieldMessage] of Object.entries(
        result.fieldErrors ?? {},
      )) {
        if (fieldMessage) {
          setError(field as keyof OrganizationSettingsValues, {
            message: fieldMessage,
          });
        }
      }
    });
  }

  return (
    <form
      className="rounded-lg border bg-card p-4 shadow-sm sm:p-5"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="size-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">Dados da organização</h2>
        </div>
        <span className="self-start rounded-md border bg-background px-2 py-1 text-xs font-medium text-muted-foreground">
          Perfil institucional
        </span>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            aria-invalid={Boolean(errors.name)}
            disabled={!canEdit}
            id="name"
            {...register("name")}
          />
          <FieldError message={errors.name?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ</Label>
          <Input
            aria-invalid={Boolean(errors.cnpj)}
            disabled={!canEdit}
            id="cnpj"
            placeholder="00.000.000/0000-00"
            {...register("cnpj")}
          />
          <FieldError message={errors.cnpj?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            disabled={!canEdit}
            id="email"
            type="email"
            {...register("email")}
          />
          <FieldError message={errors.email?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input disabled={!canEdit} id="phone" {...register("phone")} />
          <FieldError message={errors.phone?.message} />
        </div>

        <div className="space-y-3 md:col-span-2">
          <div className="space-y-2">
            <Label htmlFor="logoFile">Logo da organização</Label>
            <input
              accept=".jpg,.jpeg,.png,.svg,.webp"
              className="flex h-10 w-full min-w-0 rounded-md border border-input bg-background/96 px-3 py-2 text-sm shadow-sm outline-none transition-colors file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canEdit}
              id="logoFile"
              name="logoFile"
              onChange={(event) =>
                setLogoFile(event.target.files?.[0] ?? null)
              }
              type="file"
            />
            <p className="text-xs text-muted-foreground">
              Envie uma imagem JPG, PNG, SVG ou WEBP com no máximo 5 MB. O
              arquivo fica salvo internamente no projeto.
            </p>
            {logoFile ? (
              <p className="text-xs text-muted-foreground">
                Arquivo selecionado: {logoFile.name}
              </p>
            ) : null}
            <FieldError message={logoError ?? undefined} />
          </div>

          {logoUrl ? (
            <div className="rounded-lg border bg-background/70 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Logo atual
              </p>
              <div className="mt-3 flex items-center gap-4">
                <Image
                  alt={`Logo de ${organization.name}`}
                  className="h-16 w-16 rounded-md border bg-white object-contain p-2"
                  height={64}
                  src={logoUrl}
                  width={64}
                />
                <p className="text-sm text-muted-foreground">
                  Esta imagem pode ser usada depois em relatórios e materiais da
                  auditoria.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Endereço</Label>
          <Input disabled={!canEdit} id="address" {...register("address")} />
          <FieldError message={errors.address?.message} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            aria-invalid={Boolean(errors.description)}
            disabled={!canEdit}
            id="description"
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

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          className="w-full sm:w-auto"
          disabled={!canEdit || isPending}
          type="submit"
        >
          <Save />
          {isPending ? "Salvando..." : "Salvar organização"}
        </Button>
      </div>
    </form>
  );
}
