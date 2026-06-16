import { notFound, redirect } from "next/navigation";

import { hasRole, requireAuth } from "@/auth";
import { NonConformityForm } from "@/features/non-conformities/components/non-conformity-form";
import type { NonConformityFormValues } from "@/features/non-conformities/schemas/non-conformity-schema";
import {
  getNonConformityByIdForOrganization,
  listAuditChecklistItemOptions,
  listAuditOptions,
  listOrganizationUserOptions,
} from "@/features/non-conformities/services/non-conformity-service";

type EditNonConformityPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ from?: string }>;
};

const editorRoles = ["ADMIN", "CONSULTANT"] as const;

function dateValue(date?: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export default async function EditNonConformityPage({
  params,
  searchParams,
}: EditNonConformityPageProps) {
  const user = await requireAuth();
  if (!user.organizationId) redirect("/dashboard");
  if (!hasRole(user, editorRoles)) redirect("/non-conformities");

  const { id } = await params;
  const query = await searchParams;
  const fromAuditId = query?.from;
  const item = await getNonConformityByIdForOrganization({
    id,
    organizationId: user.organizationId,
  });
  if (!item) notFound();

  const [audits, users, checklistItems] = await Promise.all([
    listAuditOptions(user.organizationId),
    listOrganizationUserOptions(user.organizationId),
    listAuditChecklistItemOptions({
      auditId: item.audit.id,
      organizationId: user.organizationId,
    }),
  ]);

  const initialValues: NonConformityFormValues = {
    auditId: item.audit.id,
    auditChecklistItemId: item.auditChecklistItem?.id ?? "",
    auditChecklistItemIds:
      item.checklistItemLinks.length > 0
        ? item.checklistItemLinks.map((link) => link.auditChecklistItem.id)
        : item.auditChecklistItem
          ? [item.auditChecklistItem.id]
          : [],
    responsibleId: item.responsible?.id ?? "",
    title: item.title,
    description: item.description,
    severity: item.severity,
    status: item.status,
    correctionDeadline: dateValue(item.correctionDeadline),
    correctionNotes: item.correctionNotes ?? "",
  };

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          {fromAuditId ? (
            <a className="hover:underline" href={`/audits/${fromAuditId}`}>
              ← Voltar para auditoria
            </a>
          ) : "Não Conformidades"}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Editar não conformidade
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Atualize dados, responsavel, status e prazo.
        </p>
      </div>
      <NonConformityForm
        auditOptions={audits}
        cancelHref={fromAuditId ? `/audits/${fromAuditId}` : `/non-conformities/${item.id}`}
        checklistItemsByAudit={{ [item.audit.id]: checklistItems }}
        id={item.id}
        initialValues={initialValues}
        mode="edit"
        returnTo={fromAuditId ? `/audits/${fromAuditId}` : undefined}
        userOptions={users}
      />
    </section>
  );
}
