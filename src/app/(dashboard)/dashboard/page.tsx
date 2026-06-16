import { ArrowRight, Bell, Building2, ClipboardCheck, ListTodo, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

function QuickCard({
  description,
  href,
  icon: Icon,
  title,
}: {
  description: string;
  href: string;
  icon: typeof Plus;
  title: string;
}) {
  return (
    <Link
      className="rounded-2xl border bg-card p-5 shadow-sm transition-colors hover:border-[color:rgba(194,124,58,0.28)] hover:bg-white"
      href={href}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-[color:rgba(194,124,58,0.12)] text-[color:var(--atlas-accent)]">
            <Icon className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        <ArrowRight className="mt-1 size-4 text-muted-foreground" />
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-[1.6rem] border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--atlas-accent)]">
          Painel operacional
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          A navegação principal do ATLAS está pronta. Enquanto refinamos os
          indicadores avançados, você já pode entrar direto nas áreas mais
          importantes da operação por aqui.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/audits/new">
              <Plus className="size-4" />
              Nova auditoria
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/companies/new">Nova empresa</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/notifications">
              <Bell className="size-4" />
              Notificações
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <QuickCard
          description="Entrar no fluxo completo das auditorias, acompanhar andamento e acessar relatórios finalizados."
          href="/audits"
          icon={ClipboardCheck}
          title="Auditorias"
        />
        <QuickCard
          description="Cadastrar empresas auditadas, manter dados organizados e consultar histórico."
          href="/companies"
          icon={Building2}
          title="Empresas"
        />
        <QuickCard
          description="Acompanhar respostas, devolutivas e pendências dos planos de ação em aberto."
          href="/action-plans"
          icon={ListTodo}
          title="Planos de ação"
        />
        <QuickCard
          description="Consultar alertas, atualizações e movimentações importantes da sua organização."
          href="/notifications"
          icon={Bell}
          title="Notificações"
        />
      </div>
    </section>
  );
}
