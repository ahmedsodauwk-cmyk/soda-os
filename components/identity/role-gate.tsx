import { redirect } from "next/navigation";

import {
  canAsync,
  permissionsForAsync,
} from "@/lib/identity/permission-service";
import type { Permission } from "@/lib/identity/permissions";
import { homePathForPermissions } from "@/lib/identity/nav";
import { permissionsForAccessLevel } from "@/lib/identity/access-levels";
import type { SodaSession } from "@/lib/identity/session";

interface RoleGateProps {
  session: SodaSession;
  anyOf: Permission[];
  children: React.ReactNode;
}

/** Server-side gate — Access Level permissions; redirects home when unauthorized. */
export async function RoleGate({ session, anyOf, children }: RoleGateProps) {
  const level = session.profile.accessLevel;
  const checks = await Promise.all(anyOf.map((p) => canAsync(level, p)));
  const ok = checks.some((c) => c.allowed);
  if (!ok) {
    const { permissions } = await permissionsForAsync(level);
    const home = homePathForPermissions(
      permissions.length > 0
        ? permissions
        : permissionsForAccessLevel(level)
    );
    redirect(home);
  }
  return <>{children}</>;
}
