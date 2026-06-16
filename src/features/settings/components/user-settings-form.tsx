"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { updateOrganizationUserAction } from "../actions/settings-actions";
import {
  userSettingsSchema,
  type UserSettingsValues,
} from "../schemas/user-settings-schema";
import type { EditableSettingsUser } from "../services/settings-service";

type UserSettingsFormProps = {
  user: EditableSettingsUser;
  description?: string;
  showRoleField?: boolean;
  submitLabel?: string;
  title?: string;
};

const roleLabels = {
  ADMIN: "Administrador",
  CONSULTANT: "Consultor",
  CLIENT: "Cliente",
} as const;

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null;
}

export function UserSettingsForm({
  description,
  showRoleField = true,
  submitLabel = "Salvar usuário",
  title = "Editar usuário",
  user,
}: UserSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    resetField,
    formState: { errors },
  } = useForm<UserSettingsValues>({
    resolver: zodResolver(userSettingsSchema) as Resolver<UserSettingsValues>,
    defaultValues: {
      name: user.user.name ?? "",
      phone: user.user.phone ?? "",
      email: user.user.email,
      role: user.role,
      password: "",
    },
  });

  function onSubmit(values: UserSettingsValues) {
    if (isPending) return;

    setSuccess(null);
    startTransition(async () => {
      const result = await updateOrganizationUserAction({
        userId: user.user.id,
        values,
      });

      if (!result) {
        resetField("password");
        setSuccess("Usuário atualizado com sucesso.");
        return;
      }

      if (result.error) {
        setError("root", { message: result.error });
      }

      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        if (message) {
          setError(field as keyof UserSettingsValues, { message });
        }
      }
    });
  }

  return (
    <form
      className="space-y-5 rounded-lg border bg-card p-6 shadow-sm"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">{title}</h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {showRoleField ? null : <input type="hidden" {...register("role")} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" {...register("name")} />
          <FieldError message={errors.name?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            placeholder="(00) 00000-0000"
            type="tel"
            {...register("phone")}
          />
          <FieldError message={errors.phone?.message} />
        </div>

        {showRoleField ? (
          <div className="space-y-2">
            <Label htmlFor="role">Função na organização</Label>
            <select
              className={cn("h-10 w-full rounded-md border border-input bg-background px-3 text-sm")}
              id="role"
              {...register("role")}
            >
              {Object.entries(roleLabels).map(([role, label]) => (
                <option key={role} value={role}>
                  {label}
                </option>
              ))}
            </select>
            <FieldError message={errors.role?.message} />
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Função na organização</Label>
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              {roleLabels[user.role]}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">Nova senha</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Deixe em branco para manter"
            {...register("password")}
          />
          <FieldError message={errors.password?.message} />
        </div>
      </div>

      {errors.root ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errors.root.message}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button asChild type="button" variant="outline">
          <Link href="/settings">Cancelar</Link>
        </Button>
        <Button disabled={isPending} type="submit">
          {isPending ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
