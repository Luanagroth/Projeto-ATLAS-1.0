"use client";

import { UserMinus } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { removeOrganizationUserAccessAction } from "../actions/settings-actions";

type RemoveOrganizationUserButtonProps = {
  userId: string;
  userName: string;
};

export function RemoveOrganizationUserButton({
  userId,
  userName,
}: RemoveOrganizationUserButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onRemove() {
    const confirmed = window.confirm(
      `Remover o acesso de "${userName}" desta organização? O usuário não será excluído do banco.`,
    );

    if (!confirmed || isPending) return;

    setError(null);
    startTransition(async () => {
      const result = await removeOrganizationUserAccessAction(userId);

      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-1">
      <Button
        disabled={isPending}
        onClick={onRemove}
        size="sm"
        type="button"
        variant="destructive"
      >
        <UserMinus />
        {isPending ? "Removendo..." : "Remover acesso"}
      </Button>
      {error ? <p className="max-w-xs text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
