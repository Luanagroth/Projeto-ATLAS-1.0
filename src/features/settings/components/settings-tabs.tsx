"use client";

import { Bell, LifeBuoy, ServerCog, UsersRound } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type {
  SettingsMetrics,
  SettingsOrganization,
  SettingsUser,
} from "../services/settings-service";
import { OrganizationSettingsForm } from "./organization-settings-form";
import { SettingsInvitePanel } from "./settings-invite-panel";
import { SettingsNotificationsPanel } from "./settings-notifications-panel";
import { SettingsSupportPanel } from "./settings-support-panel";
import { SettingsSystemPanel } from "./settings-system-panel";
import { SettingsUsersTable } from "./settings-users-table";

type SettingsTabsProps = {
  canEditOrganization: boolean;
  canManageUsers: boolean;
  metrics: SettingsMetrics;
  organization: SettingsOrganization;
  showSupport: boolean;
  users: SettingsUser[];
};

const tabs = [
  { id: "users", label: "Usuários", icon: UsersRound },
  { id: "notifications", label: "Notificações", icon: Bell },
  { id: "system", label: "Sistema", icon: ServerCog },
  { id: "support", label: "Suporte", icon: LifeBuoy },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function SettingsTabs({
  canEditOrganization,
  canManageUsers,
  metrics,
  organization,
  showSupport,
  users,
}: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("users");

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto rounded-lg border bg-card p-2 shadow-sm">
        {tabs
          .filter((tab) => tab.id !== "support" || showSupport)
          .map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <Button
                className={cn(
                  "shrink-0 justify-start sm:justify-center",
                  active && "bg-muted text-foreground",
                )}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
                variant="ghost"
              >
                <Icon />
                {tab.label}
              </Button>
            );
          })}
      </div>

      {activeTab === "users" ? (
        <div className="space-y-5">
          {canManageUsers ? (
            <SettingsInvitePanel organizationName={organization.name} />
          ) : null}
          <SettingsUsersTable canManage={canManageUsers} users={users} />
        </div>
      ) : null}

      {activeTab === "notifications" ? <SettingsNotificationsPanel /> : null}

      {activeTab === "system" ? (
        <div className="space-y-5">
          <OrganizationSettingsForm
            canEdit={canEditOrganization}
            organization={organization}
          />
          <SettingsSystemPanel metrics={metrics} />
        </div>
      ) : null}

      {activeTab === "support" && showSupport ? <SettingsSupportPanel /> : null}
    </div>
  );
}
