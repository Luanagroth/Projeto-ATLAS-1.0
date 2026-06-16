"use client";

import { CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { markAllNotificationsReadAction } from "../actions/notification-actions";

export function MarkAllNotificationsReadButton({
  className,
}: {
  className?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onClick() {
    if (isPending) return;

    setError(null);
    startTransition(async () => {
      const result = await markAllNotificationsReadAction();

      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-1">
      <Button
        className={cn(className)}
        disabled={isPending}
        onClick={onClick}
        type="button"
        variant="outline"
      >
        <CheckCheck />
        {isPending ? "Marcando..." : "Marcar todas como lidas"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
