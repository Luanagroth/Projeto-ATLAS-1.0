import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authConfig } from "./auth.config";
import { canAccessSection, type AppSection } from "./lib/access-policy";
import {
  isAppRole,
  type AppRole,
  type AuthenticatedSessionUser,
} from "./lib/auth-utils";

export const authOptions = authConfig;

export function getAuthSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser(): Promise<AuthenticatedSessionUser | null> {
  const session = await getAuthSession();

  if (!session?.user?.email) {
    return null;
  }

  if (!session.user.id || !isAppRole(session.user.role)) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? null,
    role: session.user.role,
    organizationId: session.user.organizationId ?? null,
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export function hasRole(
  user: AuthenticatedSessionUser,
  allowedRoles: readonly AppRole[],
) {
  return allowedRoles.includes(user.role);
}

export function assertSectionAccess(
  user: AuthenticatedSessionUser,
  section: AppSection,
  fallbackHref = "/dashboard",
) {
  if (!canAccessSection(user.role, section)) {
    redirect(fallbackHref);
  }
}
