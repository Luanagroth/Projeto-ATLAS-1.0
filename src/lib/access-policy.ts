import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Building2,
  ClipboardCheck,
  LayoutDashboard,
  Settings,
} from "lucide-react";

import type { AppRole } from "./auth-utils";

export type AppSection =
  | "dashboard"
  | "companies"
  | "audits"
  | "checklists"
  | "nonConformities"
  | "actionPlans"
  | "notifications"
  | "settings";

type NavigationItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  section: AppSection;
};

const sectionRoles: Record<AppSection, readonly AppRole[]> = {
  dashboard: ["ADMIN", "CONSULTANT", "CLIENT"],
  companies: ["ADMIN", "CONSULTANT"],
  audits: ["ADMIN", "CONSULTANT", "CLIENT"],
  checklists: ["ADMIN", "CONSULTANT"],
  nonConformities: ["ADMIN", "CONSULTANT", "CLIENT"],
  actionPlans: ["ADMIN", "CONSULTANT", "CLIENT"],
  notifications: ["ADMIN", "CONSULTANT", "CLIENT"],
  settings: ["ADMIN"],
};

export const navigationItems: NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, section: "dashboard" },
  { label: "Empresas", href: "/companies", icon: Building2, section: "companies" },
  { label: "Auditorias", href: "/audits", icon: ClipboardCheck, section: "audits" },
  { label: "Notificações", href: "/notifications", icon: Bell, section: "notifications" },
  { label: "Configurações", href: "/settings", icon: Settings, section: "settings" },
];

export function canAccessSection(role: AppRole, section: AppSection) {
  return sectionRoles[section].includes(role);
}

export function getNavigationItemsForRole(role: AppRole) {
  return navigationItems.filter((item) => canAccessSection(role, item.section));
}
