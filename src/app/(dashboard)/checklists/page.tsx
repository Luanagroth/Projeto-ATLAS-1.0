import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { hasRole, requireAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { ChecklistsEmptyState } from "@/features/checklists/components/checklists-empty-state";
import { ChecklistsList } from "@/features/checklists/components/checklists-list";
import { listChecklistsByOrganization } from "@/features/checklists/services/checklist-service";

type ChecklistsPageProps = {
  searchParams?: Promise<{
    deleted?: string;
  }>;
};

const checklistEditorRoles = ["ADMIN", "CONSULTANT"] as const;

export default async function ChecklistsPage({
  searchParams,
}: ChecklistsPageProps) {
  const user = await requireAuth();

  if (!user.organizationId) {
    redirect("/dashboard");
  }

  const [checklists, canCreateChecklist, feedback] = await Promise.all([
    listChecklistsByOrganization(user.organizationId),
    Promise.resolve(hasRole(user, checklistEditorRoles)),
    searchParams,
  ]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Modelos de Checklist
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie templates reutilizáveis que serão aplicados dentro das auditorias.
          </p>
        </div>
        {canCreateChecklist ? (
          <Button asChild>
            <Link href="/checklists/new">
              <Plus />
              Novo modelo de checklist
            </Link>
          </Button>
        ) : null}
      </div>

      {feedback?.deleted === "1" ? (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          Modelo excluido com sucesso.
        </p>
      ) : null}

      {checklists.length > 0 ? (
        <ChecklistsList checklists={checklists} />
      ) : (
        <ChecklistsEmptyState canCreateChecklist={canCreateChecklist} />
      )}
    </section>
  );
}
