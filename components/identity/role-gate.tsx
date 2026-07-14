import { redirect } from "next/navigation";

import {
  canAsync,
  permissionsForAsync,
} from "@/lib/identity/permission-service";
import type { Permission } from "@/lib/identity/permissions";
import { homePathForAccessLevel } from "@/lib/identity/nav";
import { permissionsForAccessLevel } from "@/lib/identity/access-levels";
import { canAccessPath } from "@/lib/identity/module-access";
import type { SodaSession } from "@/lib/identity/session";

interface RoleGateProps {
  session: SodaSession;
  anyOf: Permission[];
  /**
   * Optional path to enforce Access Level module matrix (hidden modules).
   * Defaults to no path check when omitted.
   */
  path?: string;
  children: React.ReactNode;
}

/** Server-side gate — Access Level permissions; redirects home when unauthorized. */
export async function RoleGate({
  session,
  anyOf,
  path,
  children,
}: RoleGateProps) {
  const level = session.profile.accessLevel;

  if (path && !canAccessPath(level, path)) {
    const { permissions } = await permissionsForAsync(level);
    const home = homePathForAccessLevel(
      level,
      permissions.length > 0
        ? permissions
        : permissionsForAccessLevel(level)
    );
    redirect(home);
  }

  const checks = await Promise.all(anyOf.map((p) => canAsync(level, p)));
  const ok = checks.some((c) => c.allowed);
  if (!ok) {
    const { permissions } = await permissionsForAsync(level);
    const home = homePathForAccessLevel(
      level,
      permissions.length > 0
        ? permissions
        : permissionsForAccessLevel(level)
    );
    redirect(home);
  }
  return <>{children}</>;
}
