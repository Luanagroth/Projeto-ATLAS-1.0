import { ArrowRight, CheckCircle2, Circle, Lock } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AuditWorkflowGuideProps = {
  activeActionPlansCount: number;
  actionPlansCount: number;
  appliedChecklistsCount: number;
  auditId: string;
  auditStatus: "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  canCreateNonConformity: boolean;
  canExecuteChecklists: boolean;
  checklistPending: boolean;
  nonConformitiesCount: number;
  pendingNonConformitiesCount: number;
  opinionCompleted: boolean;
  plansAwaitingResponse: number;
  plansInVerification: number;
  possibleIrregularities: number;
  role: "ADMIN" | "CONSULTANT" | "CLIENT";
};

type StepState = "current" | "done" | "pending" | "locked" | "neutral";

type Step = {
  description: string;
  href: string;
  label: string;
  state: StepState;
  title: string;
};

type WorkflowGuide = {
  helper: string;
  primaryAction: {
    href: string;
    label: string;
  };
  steps: Step[];
  title: string;
};

type AdminGuideInput = Pick<
  AuditWorkflowGuideProps,
  | "activeActionPlansCount"
  | "appliedChecklistsCount"
  | "auditStatus"
  | "canCreateNonConformity"
  | "canExecuteChecklists"
  | "checklistPending"
  | "pendingNonConformitiesCount"
  | "opinionCompleted"
  | "plansAwaitingResponse"
  | "plansInVerification"
  | "possibleIrregularities"
>;

type ClientGuideInput = Pick<
  AuditWorkflowGuideProps,
  "actionPlansCount" | "plansAwaitingResponse" | "plansInVerification"
>;

function stateClasses(state: StepState) {
  switch (state) {
    case "current":
      return "border-primary/30 bg-primary/10 text-foreground";
    case "done":
      return "border-emerald-500/30 bg-emerald-500/10 text-foreground";
    case "locked":
      return "border-border bg-muted/40 text-muted-foreground";
    case "neutral":
      return "border-border bg-muted/20 text-muted-foreground";
    case "pending":
    default:
      return "border-border bg-background text-muted-foreground";
  }
}

function stateLabel(state: StepState) {
  switch (state) {
    case "current":
      return "Agora";
    case "done":
      return "Concluido";
    case "locked":
      return "Bloqueado";
    case "neutral":
      return "Consulta";
    case "pending":
    default:
      return "Depois";
  }
}

function stepIcon(state: StepState) {
  if (state === "done") return <CheckCircle2 className="size-4 text-emerald-600" />;
  if (state === "current") return <ArrowRight className="size-4 text-primary" />;
  if (state === "locked") return <Lock className="size-4 text-muted-foreground" />;

  return <Circle className="size-4 text-muted-foreground" />;
}

function buildAdminGuide({
  activeActionPlansCount,
  appliedChecklistsCount,
  auditStatus,
  canCreateNonConformity,
  canExecuteChecklists,
  checklistPending,
  pendingNonConformitiesCount,
  opinionCompleted,
  plansAwaitingResponse,
  plansInVerification,
  possibleIrregularities,
}: AdminGuideInput): WorkflowGuide {
  if (appliedChecklistsCount === 0) {
    return {
      title: "Comece pela aplicacao do checklist",
      helper:
        "A auditora controla o fluxo completo. Depois do checklist, o sistema mostra o que precisa de revisao para formalizar a NC.",
      primaryAction: {
        href: "#checklists",
        label: "Aplicar checklist",
      },
      steps: [
        {
          description: "Escolha um modelo e preencha a auditoria.",
          href: "#checklists",
          label: "Aplicar checklist",
          state: canExecuteChecklists ? "current" : "locked",
          title: "1. Checklist",
        },
        {
          description: "Os itens fora do padrao aparecem para revisao.",
          href: "#irregularidades",
          label: "Revisar irregularidades",
          state: "locked",
          title: "2. Revisao",
        },
        {
          description: "Formalize a NC para liberar o plano de acao.",
          href: "#ncs",
          label: "Registrar NC",
          state: "locked",
          title: "3. NC",
        },
      ],
    };
  }

  if (checklistPending) {
    return {
      title: "Checklist em preenchimento",
      helper:
        "A etapa atual ainda e a coleta de respostas. Quando tudo estiver salvo, a auditoria avanca para a revisao das irregularidades.",
      primaryAction: {
        href: "#checklists",
        label: "Continuar checklist",
      },
      steps: [
        {
          description: "Finalize as respostas que ainda estao em aberto.",
          href: "#checklists",
          label: "Abrir checklist",
          state: "current",
          title: "1. Checklist",
        },
        {
          description: "Depois disso, revise os itens fora do padrao.",
          href: "#irregularidades",
          label: "Ir para revisao",
          state: "locked",
          title: "2. Revisao",
        },
        {
          description: "A NC vem em seguida, quando a resposta estiver concluida.",
          href: "#ncs",
          label: "Ver NCs",
          state: "locked",
          title: "3. NC",
        },
      ],
    };
  }

  if (possibleIrregularities > 0 && canCreateNonConformity) {
    return {
      title: "Revisar irregularidades antes de formalizar",
      helper:
        "O sistema ja separou os itens fora do padrao. Ao confirmar a analise, o passo seguinte e criar a NC consolidada.",
      primaryAction: {
        href: "#irregularidades",
        label: "Revisar irregularidades",
      },
      steps: [
        {
          description: "Confira as respostas marcadas como nao conformes.",
          href: "#irregularidades",
          label: "Revisar irregularidades",
          state: "current",
          title: "1. Revisao",
        },
        {
          description: "Transforme os itens aprovados em NC formal.",
          href: "#ncs",
          label: "Registrar NC",
          state: "pending",
          title: "2. NC consolidada",
        },
        {
          description: "Depois da NC, crie o plano que a empresa vai responder.",
          href: "#planos",
          label: "Criar plano",
          state: "pending",
          title: "3. Plano de acao",
        },
      ],
    };
  }

  if (pendingNonConformitiesCount > 0 && canCreateNonConformity) {
    return {
      title: "NCs prontas para virar plano",
      helper:
        "As NCs sem plano ainda estao em aberto. Formalize o que falta para liberar o passo seguinte.",
      primaryAction: {
        href: "#ncs",
        label: "Revisar NCs",
      },
      steps: [
        {
          description: "As irregularidades ja viraram NC.",
          href: "#ncs",
          label: "Abrir NCs",
          state: "done",
          title: "1. NC",
        },
        {
          description: "Agora o plano de acao precisa ser criado ou ajustado.",
          href: "#planos",
          label: "Criar plano",
          state: "current",
          title: "2. Plano de acao",
        },
        {
          description: "A verificacao vem depois do envio da resposta.",
          href: "#verificacao",
          label: "Revisar resposta",
          state: activeActionPlansCount > 0 || plansAwaitingResponse > 0 || plansInVerification > 0 ? "pending" : "locked",
          title: "3. Verificacao",
        },
      ],
    };
  }

  if (activeActionPlansCount > 0 || plansAwaitingResponse > 0) {
    return {
      title: "Plano de acao em andamento",
      helper:
        "A empresa responde os itens do plano e a auditora acompanha a evolucao antes da verificacao final.",
      primaryAction: {
        href: "#planos",
        label: "Abrir planos",
      },
      steps: [
        {
          description: "As NCs ja estao formalizadas.",
          href: "#ncs",
          label: "Ver NCs",
          state: "done",
          title: "1. NCs",
        },
        {
          description: "O plano segue em execucao pela empresa.",
          href: "#planos",
          label: "Ver plano",
          state: plansAwaitingResponse > 0 ? "current" : "done",
          title: "2. Plano de acao",
        },
        {
          description: "Depois da resposta, a verificacao libera o fechamento.",
          href: "#verificacao",
          label: "Ir para verificacao",
          state: plansInVerification > 0 ? "pending" : "locked",
          title: "3. Verificacao",
        },
      ],
    };
  }

  if (plansInVerification > 0) {
    return {
      title: "Resposta em verificacao",
      helper:
        "A empresa ja enviou a resposta. Agora a auditora deve aprovar, rejeitar ou pedir ajuste.",
      primaryAction: {
        href: "#verificacao",
        label: "Abrir verificacao",
      },
      steps: [
        {
          description: "Checklist, revisao e plano ja foram encaminhados.",
          href: "#planos",
          label: "Conferir plano",
          state: "done",
          title: "1. Plano",
        },
        {
          description: "Revise a resposta enviada pela empresa.",
          href: "#verificacao",
          label: "Revisar resposta",
          state: "current",
          title: "2. Verificacao",
        },
        {
          description: "Depois da aprovacao ou ajuste, o parecer final fecha a auditoria.",
          href: "#parecer",
          label: "Ir para parecer",
          state: opinionCompleted ? "done" : "pending",
          title: "3. Parecer",
        },
      ],
    };
  }

  if (!opinionCompleted) {
    return {
      title: "Parecer final pendente",
      helper:
        "As etapas operacionais ja foram tratadas. Falta apenas registrar a analise tecnica da auditora.",
      primaryAction: {
        href: "#parecer",
        label: "Preencher parecer",
      },
      steps: [
        {
          description: "Checklist, NCs e planos ja foram encaminhados.",
          href: "#planos",
          label: "Conferir fluxo",
          state: "done",
          title: "1. Etapas operacionais",
        },
        {
          description: "Agora e hora de consolidar a conclusao da auditoria.",
          href: "#parecer",
          label: "Abrir parecer",
          state: "current",
          title: "2. Parecer",
        },
        {
          description: "Historico, documentos e evidencias seguem como consulta.",
          href: "#historico",
          label: "Ver historico",
          state: "neutral",
          title: "3. Consulta",
        },
      ],
    };
  }

  if (auditStatus !== "COMPLETED") {
    return {
      title: "Relatorio final pronto para selagem",
      helper:
        "O parecer tecnico ja foi concluido. Agora a auditora revisa o relatorio consolidado e encerra a auditoria.",
      primaryAction: {
        href: "#relatorio",
        label: "Abrir relatorio final",
      },
      steps: [
        {
          description: "Reveja o resumo consolidado da auditoria.",
          href: "#relatorio",
          label: "Abrir relatorio",
          state: "current",
          title: "1. Relatorio final",
        },
        {
          description: "Depois da conferencia, conclua a auditoria no bloco de dados.",
          href: "#historico",
          label: "Ir para selagem",
          state: "pending",
          title: "2. Selagem da auditoria",
        },
        {
          description: "Historico, documentos e evidencias seguem como consulta.",
          href: "#historico",
          label: "Ver historico",
          state: "neutral",
          title: "3. Consulta",
        },
      ],
    };
  }

  return {
    title: "Auditoria encerrada",
    helper:
      "Tudo que precisava ser tratado ja foi encaminhado. Use o historico e os documentos apenas para consulta posterior.",
    primaryAction: {
      href: "#historico",
      label: "Ver historico",
    },
    steps: [
      {
        description: "O relatorio final ja foi selado.",
        href: "#relatorio",
        label: "Conferir relatorio",
        state: "done",
        title: "1. Encerramento",
      },
      {
        description: "Consulte documentos, evidencias e decisoes registradas.",
        href: "#documentos",
        label: "Abrir documentos",
        state: "neutral",
        title: "2. Consulta",
      },
      {
        description: "Retorne ao fluxo se for necessario reabrir a auditoria.",
        href: "#checklists",
        label: "Voltar ao inicio",
        state: "neutral",
        title: "3. Historico",
      },
    ],
  };
}

function buildClientGuide({
  actionPlansCount,
  plansAwaitingResponse,
  plansInVerification,
}: ClientGuideInput): WorkflowGuide {
  if (actionPlansCount === 0) {
    return {
      title: "A empresa participa quando o plano de acao estiver pronto.",
      helper:
        "Nesta frente, o foco da empresa e responder os planos recebidos com observacoes e evidencias.",
      primaryAction: {
        href: "/action-plans",
        label: "Ir para planos",
      },
      steps: [
        {
          description: "Aguarde a auditora formalizar as NCs e liberar os planos.",
          href: "/action-plans",
          label: "Abrir planos",
          state: "current",
          title: "1. Aguardar plano",
        },
        {
          description: "Quando receber um plano, preencha a resposta e anexe evidencias.",
          href: "/action-plans",
          label: "Responder plano",
          state: "locked",
          title: "2. Resposta",
        },
        {
          description: "Depois de enviar, a auditora revisa e devolve o retorno.",
          href: "/action-plans",
          label: "Enviar para revisao",
          state: "locked",
          title: "3. Revisao",
        },
      ],
    };
  }

  if (plansAwaitingResponse > 0) {
    return {
      title: "A empresa precisa responder os planos em aberto.",
      helper:
        "Abra o plano, preencha a execucao, anexe o que houver de evidencia e envie para revisao.",
      primaryAction: {
        href: "/action-plans",
        label: "Responder planos",
      },
      steps: [
        {
          description: "Abra o plano e veja o que a auditora pediu como correcao.",
          href: "/action-plans",
          label: "Abrir plano",
          state: "done",
          title: "1. Plano recebido",
        },
        {
          description: "Informe a resposta, observacao e evidencias do que foi feito.",
          href: "/action-plans",
          label: "Preencher resposta",
          state: "current",
          title: "2. Responder",
        },
        {
          description: "Envie a resposta para a auditora aprovar ou ajustar.",
          href: "/action-plans",
          label: "Enviar para revisao",
          state: "pending",
          title: "3. Revisao",
        },
      ],
    };
  }

  if (plansInVerification > 0) {
    return {
      title: "A resposta da empresa ja foi enviada e esta em analise.",
      helper:
        "Agora a empresa aguarda a verificacao da auditora. Se houver ajuste, o plano volta para edicao.",
      primaryAction: {
        href: "/action-plans",
        label: "Acompanhar plano",
      },
      steps: [
        {
          description: "A resposta foi enviada com sucesso.",
          href: "/action-plans",
          label: "Resposta enviada",
          state: "done",
          title: "1. Envio",
        },
        {
          description: "Aguardando a validacao da auditora.",
          href: "/action-plans",
          label: "Aguardar revisao",
          state: "current",
          title: "2. Verificacao",
        },
        {
          description: "Se for aprovado, o plano segue para encerramento.",
          href: "/action-plans",
          label: "Ver status",
          state: "pending",
          title: "3. Encerramento",
        },
      ],
    };
  }

  return {
    title: "Os planos foram respondidos. Agora e so acompanhar o retorno.",
    helper:
      "Quando tudo estiver aprovado, a empresa pode consultar o historico do plano e seguir para os proximo atendimentos.",
    primaryAction: {
      href: "/action-plans",
      label: "Abrir planos",
    },
    steps: [
      {
        description: "Respostas e evidencias ja foram enviadas.",
        href: "/action-plans",
        label: "Conferir plano",
        state: "done",
        title: "1. Envio",
      },
      {
        description: "Consulte o parecer da auditora quando ele estiver disponivel.",
        href: "/action-plans",
        label: "Ver analise",
        state: "current",
        title: "2. Retorno",
      },
      {
        description: "Use o historico do plano para rastrear ajustes e aprovacoes.",
        href: "/action-plans",
        label: "Ver historico",
        state: "neutral",
        title: "3. Historico",
      },
    ],
  };
}

export function AuditWorkflowGuide({
  activeActionPlansCount,
  actionPlansCount,
  appliedChecklistsCount,
  auditStatus,
  auditId,
  canCreateNonConformity,
  canExecuteChecklists,
  checklistPending,
  pendingNonConformitiesCount,
  opinionCompleted,
  plansAwaitingResponse,
  plansInVerification,
  possibleIrregularities,
  role,
}: AuditWorkflowGuideProps) {
  const guide =
    role === "CLIENT"
      ? buildClientGuide({
          actionPlansCount,
          plansAwaitingResponse,
          plansInVerification,
        })
      : buildAdminGuide({
          activeActionPlansCount,
          appliedChecklistsCount,
          auditStatus,
          canCreateNonConformity,
          canExecuteChecklists,
          checklistPending,
          pendingNonConformitiesCount,
          opinionCompleted,
          plansAwaitingResponse,
          plansInVerification,
          possibleIrregularities,
        });

  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Fluxo guiado
          </p>
          <h2 className="text-lg font-semibold">{guide.title}</h2>
          <p className="max-w-3xl text-sm text-muted-foreground">
            {guide.helper}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href={guide.primaryAction.href}>{guide.primaryAction.label}</Link>
          </Button>
          {role !== "CLIENT" && canCreateNonConformity ? (
            <Button asChild className="w-full sm:w-auto" size="sm" variant="outline">
              <Link href={`/audits/${auditId}/non-conformities/new`}>
                Registrar NC manual
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {guide.steps.map((step) => (
          <div
            className={cn(
              "rounded-lg border p-4 transition-colors",
              stateClasses(step.state),
            )}
            key={step.title}
          >
            <div className="flex items-center gap-2">
              {stepIcon(step.state)}
              <p className="text-xs font-semibold uppercase tracking-wide">
                {stateLabel(step.state)}
              </p>
            </div>
            <h3 className="mt-3 text-sm font-semibold">{step.title}</h3>
            <p className="mt-1 text-sm leading-6">{step.description}</p>
            <Button asChild className="mt-4 w-full sm:w-auto" size="sm" variant="outline">
              <Link href={step.href}>{step.label}</Link>
            </Button>
          </div>
        ))}
      </div>

      {role !== "CLIENT" && auditStatus === "COMPLETED" ? (
        <div className="mt-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-800">
          Auditoria encerrada. Checklist, NCs, planos, parecer e relatorio ficam
          disponiveis para consulta; documentos, evidencias e historico seguem
          neutros para rastreabilidade.
        </div>
      ) : null}
    </section>
  );
}
