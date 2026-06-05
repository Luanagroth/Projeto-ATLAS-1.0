"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { deleteNonConformityAction } from "../actions/non-conformity-actions";

type DeleteNonConformityButtonProps = {
  id: string;
  title: string;
};

export function DeleteNonConformityButton({
  id,
  title,
}: DeleteNonConformityButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    const confirmed = window.confirm(
      `Excluir a não conformidade "${title}"? Esta ação não pode ser desfeita.`,
    );

    if (!confirmed || isPending) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteNonConformityAction(id);

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
