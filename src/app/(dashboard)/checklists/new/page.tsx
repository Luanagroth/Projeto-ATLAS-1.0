import { redirect } from "next/navigation";

import { hasRole, requireAuth } from "@/auth";
import { ChecklistForm } from "@/features/checklists/components/checklist-form";

const checklistEditorRoles = ["ADMIN", "CONSULTANT"] as const;

export default async function NewChecklistPage() {
  const user = await requireAuth();

  if (!user.organizationId) {
    redirect("/dashboard");
  }

  if (!hasRole(user, checklistEditorRoles)) {
    redirect("/checklists");
  }

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Novo modelo de checklist
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Crie um template reutilizavel para aplicar dentro das auditorias.
        </p>
      </div>
      <ChecklistForm cancelHref="/checklists" mode="create" />
    </section>
  );
}
