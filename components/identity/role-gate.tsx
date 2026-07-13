import { redirect } from "next/navigation";

import {
  canAsync,
  permissionsForAsync,
} from "@/lib/identity/permission-service";
import type { Permission } from "@/lib/identity/permissions";
import { homePathForPermissions, homePathForRole } from "@/lib/identity/nav";
import type { SodaSession } from "@/lib/identity/session";

interface RoleGateProps {
  session: SodaSession;
  anyOf: Permission[];
  children: React.ReactNode;
}

/** Server-side gate — DB permissions first; redirects to authority home when unauthorized. */
export async function RoleGate({ session, anyOf, children }: RoleGateProps) {
  const checks = await Promise.all(
    anyOf.map((p) => canAsync(session.profile.role, p))
  );
  const ok = checks.some((c) => c.allowed);
  if (!ok) {
    const { permissions } = await permissionsForAsync(session.profile.role);
    const home =
      permissions.length > 0
        ? homePathForPermissions(permissions)
        : homePathForRole(session.profile.role);
    redirect(home);
  }
  return <>{children}</>;
}
