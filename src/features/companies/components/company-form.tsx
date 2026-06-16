"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";

import { createCompanyAction, updateCompanyAction } from "../actions/company-actions";
import { companySchema, type CompanyFormValues } from "../schemas/company-schema";
import { CompanyExtraFields } from "./company-extra-fields";
import {
  CompanyLocationFields,
  CompanyMainFields,
  CompanyOperationalFields,
  CompanyResponsibleFields,
} from "./company-form-sections";

type CompanyFormProps = {
  cancelHref: string;
  companyId?: string;
  initialValues?: CompanyFormValues;
  mode: "create" | "edit";
};

const emptyValues: CompanyFormValues = {
  name: "",
  cnpj: "",
  description: "",
  address: "",
  tradeName: "",
  legalName: "",
  documentType: "",
  legalType: "",
  segment: "",
  employeeCount: undefined,
  responsibleName: "",
  responsibleRole: "",
  email: "",
  phone: "",
  zipCode: "",
  city: "",
  state: "",
  country: "Brasil",
  notes: "",
  extraFields: [],
};

export function CompanyForm({
  cancelHref,
  companyId,
  initialValues,
  mode,
}: CompanyFormProps) {
  const [isPending, startTransition] = useTransition();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const isEdit = mode === "edit";
  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema) as Resolver<CompanyFormValues>,
    defaultValues: initialValues ?? emptyValues,
  });
  const zipCode = useWatch({ control, name: "zipCode" });

  useEffect(() => {
    const digits = zipCode?.replace(/\D/g, "") ?? "";

    if (digits.length !== 8) {
      return;
    }

    let cancelled = false;

    async function fetchAddress() {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          bairro?: string;
          erro?: boolean;
          localidade?: string;
          logradouro?: string;
          uf?: string;
        };

        if (cancelled || data.erro) {
          return;
        }

        const address = [data.logradouro, data.bairro].filter(Boolean).join(" - ");

        if (address) {
          setValue("address", address, { shouldDirty: true });
        }

        if (data.localidade) {
          setValue("city", data.localidade, { shouldDirty: true });
        }

        if (data.uf) {
          setValue("state", data.uf, { shouldDirty: true });
        }
      } catch {
        return;
      }
    }

    fetchAddress();

    return () => {
      cancelled = true;
    };
  }, [setValue, zipCode]);

  function onSubmit(values: CompanyFormValues) {
    if (isPending || hasSubmitted) {
      return;
    }

    setHasSubmitted(true);

    startTransition(async () => {
      const result =
        isEdit && companyId
          ? await updateCompanyAction({ companyId, values })
          : await createCompanyAction(values);

      if (!result) {
        return;
      }

      setHasSubmitted(false);

      if (result.error) {
        setError("root", {
          message: result.error,
        });
      }

      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        if (message) {
          setError(field as keyof CompanyFormValues, { message });
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
      <CompanyMainFields
        errors={errors}
        register={register}
        setValue={setValue}
        watch={watch}
      />
      <CompanyResponsibleFields
        errors={errors}
        register={register}
        setValue={setValue}
        watch={watch}
      />
      <CompanyLocationFields
        errors={errors}
        register={register}
        setValue={setValue}
        watch={watch}
      />
      <CompanyOperationalFields errors={errors} register={register} />

      <CompanyExtraFields
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
              : "Criar empresa"}
        </Button>
      </div>
    </form>
  );
}
