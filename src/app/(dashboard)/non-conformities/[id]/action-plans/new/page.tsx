import { notFound, redirect } from "next/navigation";

import { hasRole, requireAuth } from "@/auth";
import { ActionPlanForm } from "@/features/action-plans/components/action-plan-form";
import {
  getNonConformityOptionForOrganization,
  listOrganizationUserOptions,
} from "@/features/action-plans/services/action-plan-service";

type NewNonConformityActionPlanPageProps = {
  params: Promise<{ id: string }>;
};

const editorRoles = ["ADMIN", "CONSULTANT"] as const;

export default async function NewNonConformityActionPlanPage({
  params,
}: NewNonConformityActionPlanPageProps) {
  const user = await requireAuth();
  if (!user.organizationId) redirect("/dashboard");
  if (!hasRole(user, editorRoles)) redirect("/action-plans");

  const { id } = await params;
  const [nonConformity, users] = await Promise.all([
    getNonConformityOptionForOrganization({
      id,
      organizationId: user.organizationId,
    }),
    listOrganizationUserOptions(user.organizationId),
  ]);
  if (!nonConformity) notFound();

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Novo plano de ação
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Crie tarefas corretivas para {nonConformity.title}.
        </p>
      </div>
      <ActionPlanForm
        cancelHref={`/non-conformities/${nonConformity.id}`}
        fixedNonConformity={nonConformity}
        mode="create"
        userOptions={users}
      />
    </section>
  );
}
