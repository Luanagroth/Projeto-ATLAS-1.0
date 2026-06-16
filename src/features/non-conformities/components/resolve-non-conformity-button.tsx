"use client";

import { Check } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { resolveNonConformityAction } from "../actions/non-conformity-actions";

type ResolveNonConformityButtonProps = {
  id: string;
  returnTo?: string;
};

export function ResolveNonConformityButton({
  id,
  returnTo,
}: ResolveNonConformityButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onResolve() {
    setError(null);
    startTransition(async () => {
      const result = await resolveNonConformityAction(id, returnTo);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-2">
      <Button disabled={isPending} onClick={onResolve} type="button">
        <Check />
        {isPending ? "Resolvendo..." : "Marcar como resolvida"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
