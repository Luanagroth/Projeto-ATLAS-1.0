import { BellRing, Mail, ShieldCheck } from "lucide-react";

export function SettingsNotificationsPanel() {
  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <BellRing className="size-5 text-muted-foreground" />
        <h2 className="text-base font-semibold">Notificacoes</h2>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-md border bg-background p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Eventos internos</h3>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Não conformidades e planos de ação já geram notificações internas.
          </p>
          <span className="mt-3 inline-flex rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
            Ativo
          </span>
        </div>

        <div className="rounded-md border bg-background p-4">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Email</h3>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Configurações de envio por email serão habilitadas em uma etapa futura.
          </p>
          <span className="mt-3 inline-flex rounded-md border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
            Em planejamento
          </span>
        </div>
      </div>
    </section>
  );
}
