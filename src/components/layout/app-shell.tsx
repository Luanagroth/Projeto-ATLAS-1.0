import type { AuthenticatedSessionUser } from "@/lib/auth-utils";
import {
  countUnreadNotificationsForUser,
  listRecentNotificationsForUser,
} from "@/features/notifications/services/notification-service";

import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";

type AppShellProps = {
  children: React.ReactNode;
  user: AuthenticatedSessionUser;
};

export async function AppShell({ children, user }: AppShellProps) {
  let unreadNotifications = 0;
  let recentNotifications: Awaited<
    ReturnType<typeof listRecentNotificationsForUser>
  > = [];

  if (user.organizationId) {
    [unreadNotifications, recentNotifications] = await Promise.all([
      countUnreadNotificationsForUser({
        organizationId: user.organizationId,
        userId: user.id,
      }),
      listRecentNotificationsForUser({
        organizationId: user.organizationId,
        userId: user.id,
      }),
    ]);
  }

  return (
    <div className="min-h-screen bg-muted/40 lg:grid lg:grid-cols-[17rem_1fr]">
      <AppSidebar />
      <div className="flex min-h-screen flex-col">
        <AppHeader
          recentNotifications={recentNotifications}
          unreadNotifications={unreadNotifications}
          userName={user.name ?? user.email}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
