import { notFound, redirect } from "next/navigation";

import { assertSectionAccess, requireAuth } from "@/auth";
import { UserSettingsForm } from "@/features/settings/components/user-settings-form";
import { getOrganizationUserForEdit } from "@/features/settings/services/settings-service";

type EditSettingsUserPageProps = {
  params: Promise<{ userId: string }>;
};

export default async function EditSettingsUserPage({
  params,
}: EditSettingsUserPageProps) {
  const currentUser = await requireAuth();
  assertSectionAccess(currentUser, "settings");

  if (!currentUser.organizationId) {
    redirect("/");
  }

  if (currentUser.role !== "ADMIN") {
    redirect("/settings");
  }

  const { userId } = await params;
  const user = await getOrganizationUserForEdit({
    organizationId: currentUser.organizationId,
    userId,
  });

  if (!user) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Editar usuário</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Atualize nome, email, funcao e redefina a senha manualmente.
        </p>
      </div>
      <UserSettingsForm user={user} />
    </section>
  );
}
