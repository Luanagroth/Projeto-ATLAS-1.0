import { LifeBuoy, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function SettingsSupportPanel() {
  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <LifeBuoy className="size-5 text-muted-foreground" />
        <h2 className="text-base font-semibold">Suporte ao desenvolvedor</h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Este formulario e um placeholder visual. O envio real e a persistencia de
        chamados serão definidos em uma etapa futura.
      </p>

      <div className="mt-5 grid gap-5">
        <div className="space-y-2">
          <Label htmlFor="supportSubject">Assunto</Label>
          <Input id="supportSubject" disabled placeholder="Descreva o tema" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="supportMessage">Mensagem</Label>
          <Textarea
            id="supportMessage"
            disabled
            placeholder="Conte o que precisa ajustar ou investigar"
          />
        </div>
        <div className="flex flex-col gap-3 rounded-md border bg-background p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2">
            <Mail className="size-4" />
            Contato direto com o desenvolvedor será configurado futuramente.
          </span>
          <Button disabled type="button" variant="outline">
            Envio futuro
          </Button>
        </div>
      </div>
    </section>
  );
}
