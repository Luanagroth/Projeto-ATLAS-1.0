"use client";

import { useState, useTransition, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { applyChecklistToAuditAction } from "../actions/audit-checklist-actions";
import type { AvailableChecklistTemplate } from "../services/audit-checklist-service";

type ApplyChecklistFormProps = {
  auditId: string;
  templates: AvailableChecklistTemplate[];
};

export function ApplyChecklistForm({
  auditId,
  templates,
}: ApplyChecklistFormProps) {
  const [checklistId, setChecklistId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await applyChecklistToAuditAction({
        auditId,
        checklistId,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setChecklistId("");
      setMessage(result.success ?? "Checklist aplicado.");
    });
  }

  return (
    <form className="rounded-lg border bg-card p-5 shadow-sm" onSubmit={onSubmit}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="checklistId">Modelo de checklist</Label>
          <select
            id="checklistId"
            className={cn(
              "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            )}
            onChange={(event) => setChecklistId(event.target.value)}
            value={checklistId}
          >
            <option value="">Selecione um modelo</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} ({template._count.items} itens)
              </option>
            ))}
          </select>
        </div>
        <Button disabled={isPending || !checklistId} type="submit">
          {isPending ? "Aplicando..." : "Aplicar checklist"}
        </Button>
      </div>

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      {message ? (
        <p className="mt-3 text-sm text-emerald-700">{message}</p>
      ) : null}
    </form>
  );
}
