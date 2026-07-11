import { redirect } from "next/navigation";

import { can, type Permission } from "@/lib/identity/permissions";
import { homePathForRole } from "@/lib/identity/nav";
import type { SodaSession } from "@/lib/identity/session";

interface RoleGateProps {
  session: SodaSession;
  anyOf: Permission[];
  children: React.ReactNode;
}

/** Server-side role gate — redirects to role home when unauthorized. */
export function RoleGate({ session, anyOf, children }: RoleGateProps) {
  const ok = anyOf.some((p) => can(session.profile.role, p));
  if (!ok) {
    redirect(homePathForRole(session.profile.role));
  }
  return <>{children}</>;
}
