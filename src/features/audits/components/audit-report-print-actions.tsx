"use client";

import { Printer } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type AuditReportPrintActionsProps = {
  backHref: string;
};

export function AuditReportPrintActions({
  backHref,
}: AuditReportPrintActionsProps) {
  return (
    <div className="print-hidden sticky top-0 z-20 border-b bg-white/96 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Relatorio pronto para envio</p>
          <p className="text-sm text-muted-foreground">
            Use o botao abaixo para abrir a impressao e salvar como PDF.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => window.print()} type="button">
            <Printer />
            Exportar em PDF
          </Button>
          <Button asChild type="button" variant="outline">
            <Link href={backHref}>Voltar para auditoria</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
