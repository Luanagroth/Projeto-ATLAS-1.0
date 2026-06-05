import { UsersRound } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import type { SettingsUser } from "../services/settings-service";
import { RemoveOrganizationUserButton } from "./remove-organization-user-button";

type SettingsUsersTableProps = {
  canManage: boolean;
  users: SettingsUser[];
};

const roleLabels = {
  ADMIN: "Administrador",
  CONSULTANT: "Consultor",
  CLIENT: "Cliente",
} as const;

function userName(user: SettingsUser["user"]) {
  return user.name ?? user.email;
}

export function SettingsUsersTable({ canManage, users }: SettingsUsersTableProps) {
  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <UsersRound className="size-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">Usuários da organização</h2>
        </div>
        {canManage ? (
          <span className="rounded-md border bg-background px-2 py-1 text-xs font-medium text-muted-foreground">
            Convites em etapa futura
          </span>
        ) : null}
      </div>

      <div className="mt-5 overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">Funcao</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {canManage ? <th className="px-4 py-3 font-medium">Acoes</th> : null}
            </tr>
          </thead>
          <tbody>
            {users.map((membership) => (
              <tr className="border-t" key={membership.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{userName(membership.user)}</p>
                  <p className="mt-1 text-muted-foreground">{membership.user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-md border bg-background px-2 py-1 text-xs font-medium">
                    {roleLabels[membership.role]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                    Ativo
                  </span>
                </td>
                {canManage ? (
                  <td className="space-y-2 px-4 py-3">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/settings/users/${membership.user.id}/edit`}>
                        Editar
                      </Link>
                    </Button>
                    <RemoveOrganizationUserButton
                      userId={membership.user.id}
                      userName={userName(membership.user)}
                    />
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
