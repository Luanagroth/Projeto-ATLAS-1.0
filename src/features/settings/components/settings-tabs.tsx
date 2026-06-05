"use client";

import { Bell, Building2, LifeBuoy, ServerCog, UsersRound } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type {
  SettingsMetrics,
  SettingsOrganization,
  SettingsUser,
} from "../services/settings-service";
import { OrganizationSettingsForm } from "./organization-settings-form";
import { SettingsNotificationsPanel } from "./settings-notifications-panel";
import { SettingsSystemPanel } from "./settings-system-panel";
import { SettingsSupportPanel } from "./settings-support-panel";
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
  { id: "organization", label: "Organização", icon: Building2 },
  { id: "users", label: "Usuários", icon: UsersRound },
  { id: "notifications", label: "Notificacoes", icon: Bell },
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
  const [activeTab, setActiveTab] = useState<TabId>("organization");

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
              className={cn("shrink-0", active && "bg-muted text-foreground")}
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

      {activeTab === "organization" ? (
        <OrganizationSettingsForm
          canEdit={canEditOrganization}
          organization={organization}
        />
      ) : null}
      {activeTab === "users" ? (
        <SettingsUsersTable canManage={canManageUsers} users={users} />
      ) : null}
      {activeTab === "notifications" ? <SettingsNotificationsPanel /> : null}
      {activeTab === "system" ? <SettingsSystemPanel metrics={metrics} /> : null}
      {activeTab === "support" && showSupport ? <SettingsSupportPanel /> : null}
    </div>
  );
}
