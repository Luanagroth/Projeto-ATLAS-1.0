"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { deleteActionPlanAction } from "../actions/action-plan-actions";

type DeleteActionPlanButtonProps = {
  id: string;
  returnTo?: string;
  title: string;
};

export function DeleteActionPlanButton({
  id,
  returnTo,
  title,
}: DeleteActionPlanButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    const confirmed = window.confirm(
      `Excluir o plano de ação "${title}"? Esta ação não pode ser desfeita.`,
    );

    if (!confirmed || isPending) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteActionPlanAction(id, returnTo);

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
        type="button"
        variant="destructive"
      >
        <Trash2 />
        {isPending ? "Excluindo..." : "Excluir"}
      </Button>
      {error ? <p className="max-w-sm text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
