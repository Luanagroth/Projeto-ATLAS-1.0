"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { markNotificationReadAction } from "../actions/notification-actions";

type MarkNotificationReadButtonProps = {
  id: string;
};

export function MarkNotificationReadButton({
  id,
}: MarkNotificationReadButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onClick() {
    if (isPending) return;

    setError(null);
    startTransition(async () => {
      const result = await markNotificationReadAction(id);

      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-1">
      <Button disabled={isPending} onClick={onClick} size="sm" type="button" variant="outline">
        <Check />
        {isPending ? "Marcando..." : "Marcar como lida"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
