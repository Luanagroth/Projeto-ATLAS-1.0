import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { assertSectionAccess, hasRole, requireAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { ChecklistDetailsCard } from "@/features/checklists/components/checklist-details-card";
import { DeleteChecklistButton } from "@/features/checklists/components/delete-checklist-button";
import { getChecklistByIdForOrganization } from "@/features/checklists/services/checklist-service";

type ChecklistPageProps = {
  params: Promise<{
    checklistId: string;
  }>;
  searchParams?: Promise<{
    created?: string;
    updated?: string;
  }>;
};

const checklistEditorRoles = ["ADMIN", "CONSULTANT"] as const;
const checklistAdminRoles = ["ADMIN"] as const;

export default async function ChecklistPage({
  params,
  searchParams,
}: ChecklistPageProps) {
  const user = await requireAuth();
  assertSectionAccess(user, "checklists");

  if (!user.organizationId) {
    redirect("/");
  }

  const { checklistId } = await params;
  const checklist = await getChecklistByIdForOrganization({
    checklistId,
    organizationId: user.organizationId,
  });

  if (!checklist) {
    notFound();
  }

  const canEditChecklist = hasRole(user, checklistEditorRoles);
  const canDeleteChecklist = hasRole(user, checklistAdminRoles);
  const feedback = await searchParams;
  const successMessage =
    feedback?.created === "1"
      ? "Modelo criado com sucesso."
      : feedback?.updated === "1"
        ? "Modelo atualizado com sucesso."
        : null;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Modelos de Checklist
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {checklist.name}
          </h1>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/checklists">Voltar</Link>
          </Button>
          {canDeleteChecklist ? (
            <DeleteChecklistButton
              checklistId={checklist.id}
              checklistName={checklist.name}
            />
          ) : null}
          {canEditChecklist ? (
            <Button asChild>
              <Link href={`/checklists/${checklist.id}/edit`}>
                Editar modelo de checklist
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {successMessage ? (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </p>
      ) : null}

      <ChecklistDetailsCard checklist={checklist} />
    </section>
  );
}
