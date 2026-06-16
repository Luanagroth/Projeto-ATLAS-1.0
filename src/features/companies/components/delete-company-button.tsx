"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { deleteCompanyAction } from "../actions/company-actions";

type DeleteCompanyButtonProps = {
  companyId: string;
  companyName: string;
  size?: "default" | "sm";
};

export function DeleteCompanyButton({
  companyId,
  companyName,
  size = "default",
}: DeleteCompanyButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    const confirmed = window.confirm(
      `Excluir a empresa "${companyName}"? Esta ação não pode ser desfeita.`,
    );

    if (!confirmed || isPending) {
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await deleteCompanyAction(companyId);

      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button
        disabled={isPending}
        onClick={onDelete}
        size={size}
        type="button"
        variant="destructive"
      >
        <Trash2 />
        {isPending ? "Excluindo..." : "Excluir empresa"}
      </Button>
      {error ? (
        <p className="max-w-sm text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
