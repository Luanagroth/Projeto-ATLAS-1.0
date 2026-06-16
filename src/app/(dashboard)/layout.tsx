import { redirect } from "next/navigation";

import { requireAuth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireAuth();

  if (!user.organizationId) {
    redirect("/");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
