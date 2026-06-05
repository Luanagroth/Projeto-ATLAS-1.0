import { notFound, redirect } from "next/navigation";

import { hasRole, requireAuth } from "@/auth";
import { ActionPlanForm } from "@/features/action-plans/components/action-plan-form";
import type { ActionPlanFormValues } from "@/features/action-plans/schemas/action-plan-schema";
import {
  getActionPlanByIdForOrganization,
  getNonConformityOptionForOrganization,
  listOrganizationUserOptions,
} from "@/features/action-plans/services/action-plan-service";

type EditActionPlanPageProps = {
  params: Promise<{ id: string }>;
};

const editorRoles = ["ADMIN", "CONSULTANT"] as const;

function dateValue(date?: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export default async function EditActionPlanPage({
  params,
}: EditActionPlanPageProps) {
  const user = await requireAuth();
  if (!user.organizationId) redirect("/dashboard");
  if (!hasRole(user, editorRoles)) redirect("/action-plans");

  const { id } = await params;
  const item = await getActionPlanByIdForOrganization({
    id,
    organizationId: user.organizationId,
  });
  if (!item) notFound();

  const [nonConformity, users] = await Promise.all([
    getNonConformityOptionForOrganization({
      id: item.nonConformity.id,
      organizationId: user.organizationId,
    }),
    listOrganizationUserOptions(user.organizationId),
  ]);
  if (!nonConformity) notFound();

  const initialValues: ActionPlanFormValues = {
    nonConformityId: item.nonConformity.id,
    responsibleId: item.responsible?.id ?? "",
    title: item.title,
    description: item.description ?? "",
    status: item.status,
    priority: item.priority,
    dueDate: dateValue(item.dueDate),
    notes: item.notes ?? "",
  };

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Editar plano de ação
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Atualize responsavel, prioridade, status, prazo e observacoes.
        </p>
      </div>
      <ActionPlanForm
        cancelHref={`/action-plans/${item.id}`}
        fixedNonConformity={nonConformity}
        id={item.id}
        initialValues={initialValues}
        mode="edit"
        userOptions={users}
      />
    </section>
  );
}
