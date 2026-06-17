import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { hasRole, requireAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { getAuditChecklistExecution } from "@/features/audit-checklists/services/audit-checklist-service";
import { getAuditByIdForOrganization } from "@/features/audits/services/audit-service";
import { NonConformityForm } from "@/features/non-conformities/components/non-conformity-form";
import {
  listAuditChecklistItemOptions,
  listAuditOptions,
  listOrganizationUserOptions,
} from "@/features/non-conformities/services/non-conformity-service";

type NewAuditNonConformityPageProps = {
  params: Promise<{ auditId: string }>;
  searchParams?: Promise<{ itemId?: string; occurrence?: string }>;
};

const editorRoles = ["ADMIN", "CONSULTANT"] as const;

type AppliedChecklistItem = Awaited<
  ReturnType<typeof getAuditChecklistExecution>
>[number]["items"][number];
type AppliedChecklist = Awaited<
  ReturnType<typeof getAuditChecklistExecution>
>[number];

function answerLabel(item: AppliedChecklistItem) {
  const response = item.responses[0];

  if (!response) return "Sem resposta";

  if (item.type === "SIM_NAO") {
    return response.answerChoice === "true"
      ? "Verdadeiro / Sim"
      : response.answerChoice === "false"
        ? "Falso / Nao"
        : "Sem resposta";
  }

  if (item.type === "TEXTO") return response.answerText ?? "Sem resposta";
  if (item.type === "NUMERO") {
    return typeof response.answerNumber === "number"
      ? String(response.answerNumber)
      : "Sem resposta";
  }
  if (item.type === "DATA") {
    return response.answerDate
      ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(
          response.answerDate,
        )
      : "Sem resposta";
  }

  return response.answerChoice ?? "Sem resposta";
}

export default async function NewAuditNonConformityPage({
  params,
  searchParams,
}: NewAuditNonConformityPageProps) {
  const user = await requireAuth();

  if (!user.organizationId) redirect("/dashboard");
  if (!hasRole(user, editorRoles)) redirect("/non-conformities");

  const { auditId } = await params;
  const query = await searchParams;
  const selectedItemId = query?.itemId;
  const isConsolidatedOccurrence = query?.occurrence === "1";

  const audit = await getAuditByIdForOrganization({
    auditId,
    organizationId: user.organizationId,
  });

  if (!audit) notFound();

  const [audits, users, checklistItems, appliedChecklists] = await Promise.all([
    listAuditOptions(user.organizationId),
    listOrganizationUserOptions(user.organizationId),
    listAuditChecklistItemOptions({
      auditId,
      organizationId: user.organizationId,
    }),
    getAuditChecklistExecution({
      auditId,
      organizationId: user.organizationId,
    }),
  ]);

  const selectedItem = selectedItemId
    ? checklistItems.find((item) => item.id === selectedItemId)
    : null;
  const occurrenceItems = isConsolidatedOccurrence
    ? appliedChecklists.flatMap((checklist: AppliedChecklist) => {
        return checklist.items
          .filter((item: AppliedChecklistItem) => {
            const response = item.responses[0];

            return (
              response?.answerBoolean === false &&
              item.nonConformities.length === 0
            );
          })
          .map((item: AppliedChecklistItem) => ({
            checklistName: checklist.checklistName,
            item,
          }));
      })
    : [];
  const occurrenceDescription =
    occurrenceItems.length > 0
      ? [
          "Ocorrencia consolidada criada a partir da revisao do checklist.",
          "O plano de acao deve contemplar todos os itens nao conformes listados abaixo.",
          "",
          "Itens nao conformes incluidos:",
          ...occurrenceItems.map(
            ({
              checklistName,
              item,
            }: {
              checklistName: string;
              item: AppliedChecklistItem;
            }) => {
            return `- [${checklistName}] ${item.question} | Resposta: ${answerLabel(item)}`;
            },
          ),
        ].join("\n")
      : "";
  const initialValues = selectedItem
    ? {
        auditChecklistItemId: selectedItem.id,
        auditChecklistItemIds: [selectedItem.id],
        auditId: audit.id,
        correctionDeadline: "",
        correctionNotes: "",
        description: `Item do checklist em revisao: ${selectedItem.question}`,
        responsibleId: "",
        severity: "MEDIUM" as const,
        status: "OPEN" as const,
        title: selectedItem.question,
      }
    : isConsolidatedOccurrence
      ? {
          auditChecklistItemId: occurrenceItems[0]?.item.id ?? "",
          auditChecklistItemIds: occurrenceItems.map(
            ({ item }: { item: AppliedChecklistItem }) => item.id,
          ),
          auditId: audit.id,
          correctionDeadline: "",
          correctionNotes: "",
          description:
            occurrenceDescription ||
            "Ocorrencia consolidada criada a partir da revisao do checklist.",
          responsibleId: "",
          severity: "MEDIUM" as const,
          status: "OPEN" as const,
          title: "Ocorrencia de irregularidades do checklist",
        }
      : undefined;

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            <Link className="hover:underline" href={`/audits/${audit.id}`}>
              Voltar para Auditoria
            </Link>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Nova nao conformidade
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registre uma NC para {audit.title}.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={`/audits/${audit.id}`}>Voltar para Auditoria</Link>
        </Button>
      </div>

      {selectedItem ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm font-medium text-amber-800">
            Revisao a partir do checklist
          </p>
          <p className="mt-1 text-sm text-amber-700">
            Item selecionado: <strong>{selectedItem.question}</strong>
          </p>
          <p className="mt-1 text-xs text-amber-700">
            O formulario abaixo ficara vinculado a este item.
          </p>
          {selectedItem.nonConformities.length > 0 ? (
            <div className="mt-3 rounded-md border border-amber-500/30 bg-background/70 p-3 text-sm text-amber-800">
              Este item ja possui {selectedItem.nonConformities.length} NC
              {selectedItem.nonConformities.length !== 1 ? "s" : ""} vinculada
              {selectedItem.nonConformities.length !== 1 ? "s" : ""}. Revise
              antes de criar outra.
            </div>
          ) : null}
        </div>
      ) : null}

      {isConsolidatedOccurrence ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm font-medium text-amber-800">
            Ocorrencia consolidada
          </p>
          <p className="mt-1 text-sm text-amber-700">
            O formulario abaixo cria uma unica NC para agrupar os itens em
            revisao. Ela sera vinculada ao primeiro item e os demais ficarao
            descritos no texto da NC ate criarmos o vinculo multiplo no banco.
          </p>
          <p className="mt-2 text-xs font-medium text-amber-800">
            {occurrenceItems.length} item
            {occurrenceItems.length !== 1 ? "s" : ""} incluido
            {occurrenceItems.length !== 1 ? "s" : ""}.
          </p>
        </div>
      ) : null}

      <NonConformityForm
        auditOptions={audits}
        cancelHref={`/audits/${audit.id}`}
        checklistItemsByAudit={{ [audit.id]: checklistItems }}
        fixedAuditId={audit.id}
        initialValues={initialValues}
        mode="create"
        returnTo={`/audits/${audit.id}`}
        userOptions={users}
      />
    </section>
  );
}
