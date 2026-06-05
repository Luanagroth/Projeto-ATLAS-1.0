"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { UseFormSetValue, UseFormWatch } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  companyDocumentTypeOptions,
  companyLegalTypeOptions,
  type CompanyFormValues,
} from "../schemas/company-schema";

type CompanyFieldsProps = {
  errors: FieldErrors<CompanyFormValues>;
  register: UseFormRegister<CompanyFormValues>;
};

type InteractiveCompanyFieldsProps = CompanyFieldsProps & {
  setValue: UseFormSetValue<CompanyFormValues>;
  watch: UseFormWatch<CompanyFormValues>;
};

type TextFieldProps = CompanyFieldsProps & {
  autoComplete?: string;
  id: keyof CompanyFormValues;
  inputMode?: "email" | "numeric" | "search" | "tel" | "text" | "url";
  label: string;
  min?: number;
  placeholder?: string;
  type?: string;
};

type TextareaFieldProps = CompanyFieldsProps & {
  id: keyof CompanyFormValues;
  label: string;
};

type SelectFieldProps = CompanyFieldsProps & {
  id: keyof CompanyFormValues;
  label: string;
  options: readonly string[];
};

function digitsOnly(value?: string) {
  return value?.replace(/\D/g, "") ?? "";
}

function formatCnpj(value?: string) {
  const digits = digitsOnly(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatPhone(value?: string) {
  const digits = digitsOnly(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function formatZipCode(value?: string) {
  return digitsOnly(value).slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null;
}

function fieldMessage(
  errors: FieldErrors<CompanyFormValues>,
  id: keyof CompanyFormValues,
) {
  const error = errors[id];

  return typeof error?.message === "string" ? error.message : undefined;
}

function TextField({
  autoComplete,
  errors,
  id,
  inputMode,
  label,
  min,
  placeholder,
  register,
  type,
}: TextFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        autoComplete={autoComplete}
        inputMode={inputMode}
        min={min}
        placeholder={placeholder}
        type={type}
        aria-invalid={Boolean(errors[id])}
        {...register(id)}
      />
      <FieldError message={fieldMessage(errors, id)} />
    </div>
  );
}

function TextareaField({ errors, id, label, register }: TextareaFieldProps) {
  return (
    <div className="space-y-2 sm:col-span-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        aria-invalid={Boolean(errors[id])}
        {...register(id)}
      />
      <FieldError message={fieldMessage(errors, id)} />
    </div>
  );
}

function SelectField({ errors, id, label, options, register }: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        className={cn("h-10 w-full rounded-md border border-input bg-background px-3 text-sm")}
        aria-invalid={Boolean(errors[id])}
        {...register(id)}
      >
        <option value="">Selecione</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <FieldError message={fieldMessage(errors, id)} />
    </div>
  );
}

function SectionIntro({
  description,
  title,
}: {
  description?: string;
  title: string;
}) {
  return (
    <div>
      <h2 className="text-base font-semibold">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export function CompanyMainFields({
  errors,
  register,
  setValue,
  watch,
}: InteractiveCompanyFieldsProps) {
  const cnpj = watch("cnpj");

  return (
    <section className="space-y-4">
      <SectionIntro
        description="Identificação comercial, fiscal e ramo de atuação."
        title="Dados principais"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          autoComplete="organization"
          errors={errors}
          id="name"
          label="Nome"
          register={register}
        />
        <TextField
          errors={errors}
          id="tradeName"
          label="Nome fantasia"
          register={register}
        />
        <div className="sm:col-span-2">
          <TextField
            errors={errors}
            id="legalName"
            label="Razao social"
            register={register}
          />
        </div>
        <SelectField
          errors={errors}
          id="documentType"
          label="Tipo de documento"
          options={companyDocumentTypeOptions}
          register={register}
        />
        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ/documento</Label>
          <input type="hidden" {...register("cnpj")} />
          <Input
            id="cnpj"
            inputMode="numeric"
            value={formatCnpj(cnpj)}
            aria-invalid={Boolean(errors.cnpj)}
            onChange={(event) =>
              setValue("cnpj", digitsOnly(event.target.value).slice(0, 14), {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
          <FieldError message={fieldMessage(errors, "cnpj")} />
        </div>
        <SelectField
          errors={errors}
          id="legalType"
          label="Tipo juridico"
          options={companyLegalTypeOptions}
          register={register}
        />
        <TextField
          errors={errors}
          id="segment"
          label="Ramo de atuação"
          register={register}
        />
      </div>
    </section>
  );
}

export function CompanyResponsibleFields({
  errors,
  register,
  setValue,
  watch,
}: InteractiveCompanyFieldsProps) {
  const phone = watch("phone");

  return (
    <section className="space-y-4 border-t pt-5">
      <SectionIntro
        description="Contato principal para auditorias e conformidade."
        title="Responsavel"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          errors={errors}
          id="responsibleName"
          label="Nome do responsavel"
          register={register}
        />
        <TextField
          errors={errors}
          id="responsibleRole"
          label="Cargo"
          register={register}
        />
        <TextField
          errors={errors}
          id="email"
          label="Email"
          register={register}
          type="email"
        />
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <input type="hidden" {...register("phone")} />
          <Input
            id="phone"
            inputMode="tel"
            value={formatPhone(phone)}
            aria-invalid={Boolean(errors.phone)}
            onChange={(event) =>
              setValue("phone", digitsOnly(event.target.value).slice(0, 11), {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
          <FieldError message={fieldMessage(errors, "phone")} />
        </div>
      </div>
    </section>
  );
}

export function CompanyLocationFields({
  errors,
  register,
  setValue,
  watch,
}: InteractiveCompanyFieldsProps) {
  const zipCode = watch("zipCode");

  return (
    <section className="space-y-4 border-t pt-5">
      <SectionIntro title="Localização" />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="zipCode">CEP</Label>
          <input type="hidden" {...register("zipCode")} />
          <Input
            id="zipCode"
            inputMode="numeric"
            value={formatZipCode(zipCode)}
            aria-invalid={Boolean(errors.zipCode)}
            onChange={(event) =>
              setValue("zipCode", digitsOnly(event.target.value).slice(0, 8), {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
          <FieldError message={fieldMessage(errors, "zipCode")} />
        </div>
        <TextField errors={errors} id="country" label="Pais" register={register} />
        <TextField errors={errors} id="city" label="Cidade" register={register} />
        <TextField errors={errors} id="state" label="Estado" register={register} />
        <div className="sm:col-span-2">
          <TextField
            autoComplete="street-address"
            errors={errors}
            id="address"
            label="Endereco"
            register={register}
          />
        </div>
      </div>
    </section>
  );
}

export function CompanyOperationalFields({
  errors,
  register,
}: CompanyFieldsProps) {
  return (
    <section className="space-y-4 border-t pt-5">
      <SectionIntro title="Informacoes operacionais" />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          errors={errors}
          id="employeeCount"
          label="Numero de colaboradores"
          min={0}
          register={register}
          type="number"
        />
        <TextareaField
          errors={errors}
          id="description"
          label="Descrição"
          register={register}
        />
        <TextareaField
          errors={errors}
          id="notes"
          label="Observacoes"
          register={register}
        />
      </div>
    </section>
  );
}
