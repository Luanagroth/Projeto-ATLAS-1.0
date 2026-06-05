import bcrypt from "bcryptjs";

export const appRoles = ["ADMIN", "CONSULTANT", "CLIENT"] as const;

export type AppRole = (typeof appRoles)[number];

export type AuthenticatedSessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: AppRole;
  organizationId: string | null;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isAppRole(value: unknown): value is AppRole {
  return appRoles.includes(value as AppRole);
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}
