import { notFound, redirect } from "next/navigation";

import { hasRole, requireAuth } from "@/auth";
import { getAuditByIdForOrganization } from "@/features/audits/services/audit-service";
import { NonConformityForm } from "@/features/non-conformities/components/non-conformity-form";
import {
  listAuditChecklistItemOptions,
  listAuditOptions,
  listOrganizationUserOptions,
} from "@/features/non-conformities/services/non-conformity-service";

type NewAuditNonConformityPageProps = {
  params: Promise<{ auditId: string }>;
};

const editorRoles = ["ADMIN", "CONSULTANT"] as const;

export default async function NewAuditNonConformityPage({
  params,
}: NewAuditNonConformityPageProps) {
  const user = await requireAuth();
  if (!user.organizationId) redirect("/dashboard");
  if (!hasRole(user, editorRoles)) redirect("/non-conformities");

  const { auditId } = await params;
  const audit = await getAuditByIdForOrganization({
    auditId,
    organizationId: user.organizationId,
  });
  if (!audit) notFound();

  const [audits, users, checklistItems] = await Promise.all([
    listAuditOptions(user.organizationId),
    listOrganizationUserOptions(user.organizationId),
    listAuditChecklistItemOptions({ auditId, organizationId: user.organizationId }),
  ]);

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Nova não conformidade
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registre uma não conformidade manual para {audit.title}.
        </p>
      </div>
      <NonConformityForm
        auditOptions={audits}
        cancelHref={`/audits/${audit.id}`}
        checklistItemsByAudit={{ [audit.id]: checklistItems }}
        fixedAuditId={audit.id}
        mode="create"
        userOptions={users}
      />
    </section>
  );
}
