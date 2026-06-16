import { redirect } from "next/navigation";

import { hasRole, requireAuth } from "@/auth";
import { ChecklistForm } from "@/features/checklists/components/checklist-form";

const checklistEditorRoles = ["ADMIN", "CONSULTANT"] as const;

type NewChecklistPageProps = {
  searchParams?: Promise<{ returnTo?: string }>;
};

export default async function NewChecklistPage({
  searchParams,
}: NewChecklistPageProps) {
  const user = await requireAuth();

  if (!user.organizationId) {
    redirect("/dashboard");
  }

  if (!hasRole(user, checklistEditorRoles)) {
    redirect("/checklists");
  }

  const query = await searchParams;
  const returnTo = query?.returnTo?.startsWith("/audits/")
    ? query.returnTo
    : undefined;

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <div>
        {returnTo ? (
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            <a className="hover:underline" href={returnTo}>
              Voltar para Auditoria
            </a>
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight">
          Novo modelo de checklist
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Crie um template reutilizavel para aplicar dentro das auditorias.
        </p>
      </div>
      <ChecklistForm
        cancelHref={returnTo ?? "/checklists"}
        mode="create"
        returnTo={returnTo}
      />
    </section>
  );
}
