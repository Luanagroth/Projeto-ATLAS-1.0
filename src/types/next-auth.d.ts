import type { DefaultSession } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

import type { AppRole } from "@/lib/auth-utils";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
      organizationId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: AppRole;
    organizationId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: AppRole;
    organizationId: string | null;
  }
}
