import { notFound, redirect } from "next/navigation";

import { assertSectionAccess, requireAuth } from "@/auth";
import { UserSettingsForm } from "@/features/settings/components/user-settings-form";
import { SettingsTabs } from "@/features/settings/components/settings-tabs";
import {
  getOrganizationMetrics,
  getOrganizationSettings,
  listOrganizationUsers,
} from "@/features/settings/services/settings-service";

export default async function SettingsPage() {
  const user = await requireAuth();
  assertSectionAccess(user, "settings");
  if (!user.organizationId) redirect("/");

  const [users, metrics, organization] = await Promise.all([
    listOrganizationUsers(user.organizationId),
    getOrganizationMetrics(user.organizationId),
    getOrganizationSettings(user.organizationId),
  ]);
  const currentMembership = users.find((membership) => membership.user.id === user.id);

  if (!currentMembership || !organization) notFound();

  const canManageUsers = user.role === "ADMIN";
  const showSupport = user.role === "ADMIN";

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Perfil da auditora, usuários e acompanhamento interno da operação.
        </p>
      </div>

      <UserSettingsForm
        description="Atualize seu nome, e-mail e senha de acesso. O perfil base continua preservado."
        showRoleField={false}
        submitLabel="Salvar perfil"
        title="Meu perfil"
        user={currentMembership}
      />

      <SettingsTabs
        canEditOrganization={user.role === "ADMIN"}
        canManageUsers={canManageUsers}
        metrics={metrics}
        organization={organization}
        showSupport={showSupport}
        users={users}
      />
    </section>
  );
}
