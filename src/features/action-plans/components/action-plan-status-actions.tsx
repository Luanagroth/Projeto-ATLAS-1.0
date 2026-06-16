"use client";

import { CheckCircle2, Play, RotateCcw, Send, XCircle } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { updateActionPlanStatusAction } from "../actions/action-plan-actions";
import type { ActionPlanStatusValue } from "../schemas/action-plan-schema";

type ActionPlanStatusActionsProps = {
  id: string;
  returnTo?: string;
  role: "ADMIN" | "CONSULTANT" | "CLIENT";
  status: ActionPlanStatusValue;
};

function actionLabel(status: ActionPlanStatusValue) {
  if (status === "IN_PROGRESS") return "Iniciando...";
  if (status === "AWAITING_REVIEW") return "Enviando...";
  if (status === "APPROVED") return "Aprovando...";
  if (status === "REJECTED") return "Reprovando...";

  return "Atualizando...";
}

export function ActionPlanStatusActions({
  id,
  returnTo,
  role,
  status,
}: ActionPlanStatusActionsProps) {
  const [error, setError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<ActionPlanStatusValue | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const canReview = role === "ADMIN" || role === "CONSULTANT";
  const canExecute = role === "CLIENT";

  function updateStatus(nextStatus: ActionPlanStatusValue) {
    if (isPending) return;

    setError(null);
    setPendingStatus(nextStatus);

    startTransition(async () => {
      const result = await updateActionPlanStatusAction({
        id,
        returnTo,
        status: nextStatus,
      });

      if (result?.error) {
        setError(result.error);
        setPendingStatus(null);
      }
    });
  }

  const label = pendingStatus ? actionLabel(pendingStatus) : null;

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        {canExecute && status === "OPEN" ? (
          <Button
            disabled={isPending}
            onClick={() => updateStatus("IN_PROGRESS")}
            type="button"
            variant="outline"
          >
            <Play />
            {label ?? "Iniciar execução"}
          </Button>
        ) : null}
        {canExecute && (status === "OPEN" || status === "IN_PROGRESS" || status === "REJECTED") ? (
          <Button
            disabled={isPending}
            onClick={() => updateStatus("AWAITING_REVIEW")}
            type="button"
          >
            <Send />
            {label ?? "Enviar para revisão"}
          </Button>
        ) : null}
        {canReview && status === "AWAITING_REVIEW" ? (
          <>
            <Button
              disabled={isPending}
              onClick={() => updateStatus("APPROVED")}
              type="button"
            >
              <CheckCircle2 />
              {label ?? "Aprovar plano"}
            </Button>
            <Button
              disabled={isPending}
              onClick={() => updateStatus("REJECTED")}
              type="button"
              variant="destructive"
            >
              <XCircle />
              {label ?? "Reprovar plano"}
            </Button>
          </>
        ) : null}
        {canReview && status === "REJECTED" ? (
          <Button
            disabled={isPending}
            onClick={() => updateStatus("IN_PROGRESS")}
            type="button"
            variant="outline"
          >
            <RotateCcw />
            {label ?? "Reabrir execução"}
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
