import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { isAppRole, normalizeEmail, verifyPassword } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = normalizeEmail(credentials?.email ?? "");
        const password = credentials?.password ?? "";

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            organizationMemberships: {
              select: {
                organizationId: true,
                role: true,
              },
              orderBy: {
                createdAt: "asc",
              },
              take: 1,
            },
          },
        });

        if (!user?.password) {
          return null;
        }

        const passwordIsValid = await verifyPassword(password, user.password);

        if (!passwordIsValid) {
          return null;
        }

        const membership = user.organizationMemberships[0];
        const role = isAppRole(membership?.role) ? membership.role : "CLIENT";

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role,
          organizationId: membership?.organizationId ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = isAppRole(user.role) ? user.role : "CLIENT";
        token.organizationId = user.organizationId ?? null;
      }

      if (token.id && typeof token.organizationId !== "string") {
        const membership = await prisma.organizationMembership.findFirst({
          where: {
            userId: String(token.id),
          },
          orderBy: {
            createdAt: "asc",
          },
          select: {
            organizationId: true,
            role: true,
          },
        });

        token.organizationId = membership?.organizationId ?? null;

        if (isAppRole(membership?.role)) {
          token.role = membership.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id);
        session.user.role = isAppRole(token.role) ? token.role : "CLIENT";
        session.user.organizationId =
          typeof token.organizationId === "string"
            ? token.organizationId
            : null;
      }

      return session;
    },
  },
} satisfies NextAuthOptions;
