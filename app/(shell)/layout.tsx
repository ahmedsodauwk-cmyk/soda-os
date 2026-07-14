/**
 * Shared authenticated shell (Mission 06.0 Phases 02–04).
 * Sidebar / Header / theme chrome stay mounted; only page children swap.
 * Session + permissions + notifications resolved once per soft-nav layout pass
 * (React cache + warm TTL; client chrome does not remount).
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ShellProvider } from "@/components/layout/shell-context";
import { ShellFrame } from "@/components/layout/shell-frame";
import { loadNotificationsForSession } from "@/lib/core/notifications/load";
import { getRecentlyViewed } from "@/lib/identity/recent";
import { permissionsForAsync } from "@/lib/identity/permission-service";
import {
  isAuthStrict,
  resolveSessionForApp,
} from "@/lib/identity/session";
import { canAccessPath } from "@/lib/identity/module-access";
import { homePathForAccessLevel } from "@/lib/identity/nav";
import { permissionsForAccessLevel } from "@/lib/identity/access-levels";

export default async function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname =
    headerList.get("x-pathname") ||
    headerList.get("x-invoke-path") ||
    headerList.get("next-url") ||
    "/";

  const session = await resolveSessionForApp();

  if (!session && isAuthStrict()) {
    redirect("/login");
  }

  if (
    session?.profile.mustChangePassword &&
    !pathname.startsWith("/settings/password") &&
    pathname !== "/login" &&
    pathname !== "/forgot-password"
  ) {
    redirect("/settings/password?forced=1");
  }

  // Parallelize shell data — never waterfall notifications → permissions.
  const [notifications, recent, permissionResult] = await Promise.all([
    loadNotificationsForSession(session),
    getRecentlyViewed(),
    session
      ? permissionsForAsync(session.profile.accessLevel)
      : Promise.resolve(null),
  ]);

  const allowedPermissions =
    permissionResult && Array.isArray(permissionResult.permissions)
      ? [...permissionResult.permissions]
      : undefined;

  if (
    session &&
    pathname &&
    !canAccessPath(session.profile.accessLevel, pathname)
  ) {
    const grants =
      allowedPermissions && allowedPermissions.length > 0
        ? allowedPermissions
        : permissionsForAccessLevel(session.profile.accessLevel);
    redirect(homePathForAccessLevel(session.profile.accessLevel, grants));
  }

  const user = session
    ? {
        userId: session.userId,
        fullName: session.profile.displayName || session.profile.fullName,
        role: session.profile.role,
        accessLevel: session.profile.accessLevel,
        avatarInitials: session.profile.avatarInitials,
        email: session.profile.email,
        personId: session.profile.personId,
        allowedPermissions,
      }
    : undefined;

  return (
    <ShellProvider user={user} notifications={notifications}>
      <ShellFrame recent={recent}>{children}</ShellFrame>
    </ShellProvider>
  );
}
