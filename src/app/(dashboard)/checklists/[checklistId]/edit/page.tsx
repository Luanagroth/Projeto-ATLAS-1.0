import { notFound, redirect } from "next/navigation";

import { hasRole, requireAuth } from "@/auth";
import { ChecklistForm } from "@/features/checklists/components/checklist-form";
import type { ChecklistFormValues } from "@/features/checklists/schemas/checklist-schema";
import {
  type ChecklistDetails,
  getChecklistByIdForOrganization,
} from "@/features/checklists/services/checklist-service";

type EditChecklistPageProps = {
  params: Promise<{
    checklistId: string;
  }>;
};

const checklistEditorRoles = ["ADMIN", "CONSULTANT"] as const;

function textValue(value?: string | null) {
  return value ?? "";
}

function parseOptions(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((option): option is string => {
    return typeof option === "string";
  });
}

function toFormValues(checklist: ChecklistDetails): ChecklistFormValues {
  return {
    name: checklist.name,
    description: textValue(checklist.description),
    category: textValue(checklist.category),
    isActive: checklist.isActive,
    items: checklist.items.map((item) => ({
      question: item.question,
      type: item.type,
      isRequired: item.isRequired,
      options: parseOptions(item.options),
    })),
  };
}

export default async function EditChecklistPage({
  params,
}: EditChecklistPageProps) {
  const user = await requireAuth();

  if (!user.organizationId) {
    redirect("/dashboard");
  }

  if (!hasRole(user, checklistEditorRoles)) {
    redirect("/checklists");
  }

  const { checklistId } = await params;
  const checklist = await getChecklistByIdForOrganization({
    checklistId,
    organizationId: user.organizationId,
  });

  if (!checklist) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Editar modelo de checklist
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Atualize os dados e itens do template reutilizavel.
        </p>
      </div>
      <ChecklistForm
        cancelHref={`/checklists/${checklist.id}`}
        checklistId={checklist.id}
        initialValues={toFormValues(checklist)}
        mode="edit"
      />
    </section>
  );
}
