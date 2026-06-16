import {
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  ListTodo,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { requireAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { getDashboardData } from "@/features/dashboard/services/dashboard-service";
import type { AppRole } from "@/lib/auth-utils";

import { StatCard } from "./stat-card";

function formatDate(date?: Date | null) {
  if (!date) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(date);
}

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function BarList({
  items,
  accent = "bg-[color:var(--atlas-secondary)]",
}: {
  accent?: string;
  items: { label: string; value: number }[];
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem dados no periodo.</p>
      ) : (
        items.map((item) => (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-muted-foreground">{item.label}</span>
              <span className="font-medium text-foreground">{item.value}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${accent}`}
                style={{ width: `${Math.max(6, (item.value / max) * 100)}%` }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function SectionCard({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  subtitle?: string;
  title: string;
}) {
  return (
    <article className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-[color:var(--atlas-accent)]" />
          <h2 className="font-semibold">{title}</h2>
        </div>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </article>
  );
}

function ActionLink({
  href,
  label,
  subtitle,
}: {
  href: string;
  label: string;
  subtitle: string;
}) {
  return (
    <Button
      asChild
      className="h-auto justify-start rounded-xl p-3 text-left shadow-none"
      variant="outline"
    >
      <Link href={href}>
        <span className="block min-w-0">
          <span className="block text-sm font-medium">{label}</span>
          <span className="mt-1 block text-xs text-muted-foreground">{subtitle}</span>
        </span>
      </Link>
    </Button>
  );
}

function AttentionItem({
  href,
  meta,
  title,
}: {
  href: string;
  meta: string;
  title: string;
}) {
  return (
    <Button
      asChild
      className="h-auto justify-start rounded-xl p-3 text-left shadow-none"
      variant="ghost"
    >
      <Link href={href}>
        <span className="block min-w-0">
          <span className="block truncate text-sm font-medium">{title}</span>
          <span className="mt-1 block text-xs text-muted-foreground">{meta}</span>
        </span>
      </Link>
    </Button>
  );
}

function FinancePanel({
  completedThisMonth,
  completedLast60Days,
  role,
}: {
  completedLast60Days: number;
  completedThisMonth: number;
  role: AppRole;
}) {
  if (role === "CLIENT") return null;

  return (
    <SectionCard
      subtitle="Base interna para faturamento e precificacao por auditoria."
      title="Controle interno"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <div className="rounded-xl border bg-background p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
            Auditorias finalizadas no mes
          </p>
          <p className="mt-2 text-2xl font-semibold">{completedThisMonth}</p>
        </div>
        <div className="rounded-xl border bg-background p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
            Auditorias finalizadas em 60 dias
          </p>
          <p className="mt-2 text-2xl font-semibold">{completedLast60Days}</p>
        </div>
        <div className="rounded-xl border border-dashed bg-accent/50 p-4 text-sm text-muted-foreground sm:col-span-2 xl:col-span-1">
          O valor por auditoria ainda nao esta configurado. A proxima etapa e criar
          uma definicao interna em configuracoes, sem expor nada para a empresa.
        </div>
        <Button asChild className="justify-start" variant="outline">
          <Link href="/settings">Configurar area interna</Link>
        </Button>
      </div>
    </SectionCard>
  );
}

export async function DashboardOverview() {
  const user = await requireAuth();
  if (!user.organizationId) redirect("/");

  const data = await getDashboardData(user.organizationId);

  const coreStats = [
    { icon: ClipboardCheck, label: "Auditorias no mes", value: data.cards.auditsThisMonth },
    { icon: Building2, label: "Empresas auditadas no mes", value: data.cards.companiesAuditedThisMonth },
    { icon: ClipboardCheck, label: "Auditorias em 60 dias", value: data.cards.auditsLast60Days },
    { icon: Building2, label: "Empresas em 60 dias", value: data.cards.companiesAuditedLast60Days },
    { icon: CheckCircle2, label: "Finalizadas no mes", value: data.cards.auditsCompletedThisMonth },
    { icon: ListTodo, label: "Planos aguardando resposta", value: data.cards.plansAwaitingResponse },
  ];

  const quickActions = [
    { href: "/audits/new", label: "Nova auditoria", subtitle: "Abrir um novo ciclo." },
    { href: "/companies/new", label: "Nova empresa", subtitle: "Cadastrar uma operacao." },
    { href: "/audits", label: "Auditorias", subtitle: "Entrar no fluxo em andamento." },
    { href: "/action-plans", label: "Planos de acao", subtitle: "Responder e revisar." },
  ];

  const attentionCount =
    data.attention.plansOverdue.length +
    data.attention.plansDueSoon.length +
    data.attention.evidencesPending.length +
    data.attention.plansInVerification.length +
    data.attention.auditsWithoutOpinion.length +
    data.attention.possibleIrregularities.length;

  return (
    <section className="space-y-6">
      <div className="rounded-[1.6rem] border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--atlas-accent)]">
              Painel operacional
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Leitura objetiva da carteira: volume do mes, janela dos ultimos 60
              dias, pendencias reais e atalhos para a operacao.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/audits/new">
                <Plus className="size-4" />
                Nova auditoria
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/notifications">Notificacoes</Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {coreStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <SectionCard
            subtitle="Aqui o foco e mostrar ritmo, nao excesso de informacao."
            title="Atividade real"
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border bg-background p-4">
                <h3 className="text-sm font-semibold">Auditorias por mes</h3>
                <div className="mt-4">
                  <BarList items={data.charts.auditsByMonth} />
                </div>
              </div>
              <div className="rounded-xl border bg-background p-4">
                <h3 className="text-sm font-semibold">Empresas auditadas por mes</h3>
                <div className="mt-4">
                  <BarList items={data.charts.companiesAuditedByPeriod} accent="bg-[color:var(--atlas-info)]" />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            subtitle="Volume de qualidade para entender se o processo esta saudavel."
            title="Indicadores de fechamento"
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border bg-background p-4">
                <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                  Taxa media de conformidade
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {formatNumber(data.summaries.conformityRate, 1)}%
                </p>
              </div>
              <div className="rounded-xl border bg-background p-4">
                <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                  Media de NCs por auditoria
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {formatNumber(data.summaries.averageNcsPerAudit, 1)}
                </p>
              </div>
              <div className="rounded-xl border bg-background p-4">
                <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                  Tempo medio de fechamento
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {formatNumber(data.summaries.averageAuditClosingDays, 1)} dias
                </p>
              </div>
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-6">
          <SectionCard
            subtitle="Acesso rapido ao que a equipe mais usa."
            title="Atalhos rapidos"
          >
            <div className="grid gap-2">
              {quickActions.map((action) => (
                <ActionLink key={action.href} {...action} />
              ))}
            </div>
          </SectionCard>

          <SectionCard
            subtitle={attentionCount > 0 ? "Pendencias que pedem acao agora." : "Nenhuma pendencia critica encontrada agora."}
            title="Prioridades"
          >
            <div className="grid gap-2">
              {data.attention.plansOverdue.map((plan) => (
                <AttentionItem
                  key={`overdue-${plan.id}`}
                  href={`/action-plans/${plan.id}`}
                  meta={`${plan.nonConformity.audit.company.name} - venceu em ${formatDate(plan.dueDate)}`}
                  title={`Plano vencido: ${plan.title}`}
                />
              ))}
              {data.attention.plansDueSoon.map((plan) => (
                <AttentionItem
                  key={`due-${plan.id}`}
                  href={`/action-plans/${plan.id}`}
                  meta={`${plan.nonConformity.audit.company.name} - vence em ${formatDate(plan.dueDate)}`}
                  title={`Prazo proximo: ${plan.title}`}
                />
              ))}
              {data.attention.plansInVerification.map((plan) => (
                <AttentionItem
                  key={`verify-${plan.id}`}
                  href={`/action-plans/${plan.id}`}
                  meta={`${plan.nonConformity.audit.company.name} - atualizado em ${formatDate(plan.updatedAt)}`}
                  title={`Resposta para revisar: ${plan.title}`}
                />
              ))}
              {data.attention.auditsWithoutOpinion.map((audit) => (
                <AttentionItem
                  key={`opinion-${audit.id}`}
                  href={`/audits/${audit.id}#parecer`}
                  meta={`${audit.company.name} - prazo ${formatDate(audit.dueDate)}`}
                  title={`Parecer pendente: ${audit.title}`}
                />
              ))}
              {data.attention.evidencesPending.map((evidence) => (
                <AttentionItem
                  key={`evidence-${evidence.id}`}
                  href={`/action-plans/${evidence.actionPlanId}`}
                  meta={`${evidence.audit.company.name} - enviada em ${formatDate(evidence.createdAt)}`}
                  title={`Evidencia pendente: ${evidence.title}`}
                />
              ))}
              {data.attention.possibleIrregularities.map((item) => (
                <AttentionItem
                  key={`irregularity-${item.auditChecklistItem.question}-${item.updatedAt.toISOString()}`}
                  href={`/audits/${item.auditChecklistItem.auditChecklist.audit.id}#irregularidades`}
                  meta={item.auditChecklistItem.auditChecklist.audit.company.name}
                  title={`Possivel irregularidade: ${item.auditChecklistItem.question}`}
                />
              ))}
            </div>
          </SectionCard>

          <FinancePanel
            completedLast60Days={data.cards.auditsCompletedLast60Days}
            completedThisMonth={data.cards.auditsCompletedThisMonth}
            role={user.role}
          />
        </aside>
      </div>
    </section>
  );
}
