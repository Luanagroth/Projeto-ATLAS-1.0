import { notFound, redirect } from "next/navigation";

import { requireAuth } from "@/auth";
import { SettingsTabs } from "@/features/settings/components/settings-tabs";
import {
  getOrganizationMetrics,
  getOrganizationSettings,
  listOrganizationUsers,
} from "@/features/settings/services/settings-service";

export default async function SettingsPage() {
  const user = await requireAuth();
  if (!user.organizationId) redirect("/dashboard");

  const [organization, users, metrics] = await Promise.all([
    getOrganizationSettings(user.organizationId),
    listOrganizationUsers(user.organizationId),
    getOrganizationMetrics(user.organizationId),
  ]);
  if (!organization) notFound();

  const canEditOrganization = user.role === "ADMIN";
  const canManageUsers = user.role === "ADMIN";
  const showSupport = user.role === "ADMIN";

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Central administrativa da organização {organization.name}.
        </p>
      </div>

      <SettingsTabs
        canEditOrganization={canEditOrganization}
        canManageUsers={canManageUsers}
        metrics={metrics}
        organization={organization}
        showSupport={showSupport}
        users={users}
      />
    </section>
  );
}
