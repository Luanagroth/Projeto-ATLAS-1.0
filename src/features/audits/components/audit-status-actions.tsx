"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { updateAuditStatusAction } from "../actions/audit-actions";
import {
  auditStatusActionLabels,
  auditStatusTransitions,
  type AuditStatusValue,
} from "../schemas/audit-schema";

type AuditStatusActionsProps = {
  auditId: string;
  currentStatus: AuditStatusValue;
};

const statusButtonVariants: Record<string, "default" | "outline" | "destructive"> = {
  "DRAFT->IN_PROGRESS": "default",
  "DRAFT->CANCELLED": "destructive",
  "IN_PROGRESS->COMPLETED": "default",
  "IN_PROGRESS->CANCELLED": "destructive",
  "COMPLETED->IN_PROGRESS": "outline",
};

export function AuditStatusActions({
  auditId,
  currentStatus,
}: AuditStatusActionsProps) {
  const transitions = auditStatusTransitions[currentStatus] ?? [];
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (transitions.length === 0) {
    return null;
  }

  function handleTransition(targetStatus: AuditStatusValue) {
    setError(null);
    startTransition(async () => {
      const result = await updateAuditStatusAction({
        auditId,
        status: targetStatus,
      });

      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {transitions.map((targetStatus) => {
          const key = `${currentStatus}->${targetStatus}`;
          const label = auditStatusActionLabels[key] ?? targetStatus;
          const variant = statusButtonVariants[key] ?? "outline";

          return (
            <Button
              key={targetStatus}
              disabled={isPending}
              onClick={() => handleTransition(targetStatus)}
              size="sm"
              variant={variant}
            >
              {isPending ? "Aguarde..." : label}
            </Button>
          );
        })}
      </div>
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
