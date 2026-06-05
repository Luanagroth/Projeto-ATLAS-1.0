"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { deleteChecklistAction } from "../actions/checklist-actions";

type DeleteChecklistButtonProps = {
  checklistId: string;
  checklistName: string;
};

export function DeleteChecklistButton({
  checklistId,
  checklistName,
}: DeleteChecklistButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    const confirmed = window.confirm(
      `Excluir o modelo "${checklistName}"? Esta ação não pode ser desfeita.`,
    );

    if (!confirmed || isPending) {
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await deleteChecklistAction(checklistId);

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
        {isPending ? "Excluindo..." : "Excluir modelo"}
      </Button>
      {error ? <p className="max-w-sm text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
