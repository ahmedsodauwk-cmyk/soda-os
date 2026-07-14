/**
 * SODA Brain access helpers — Founder only.
 */

import { isFounderAccess, type AccessLevel } from "@/lib/identity/access-levels";
import type { SodaSession } from "@/lib/identity/session";

export function canAccessBrain(level: AccessLevel): boolean {
  return isFounderAccess(level);
}

export function sessionCanAccessBrain(session: SodaSession | null | undefined): boolean {
  if (!session) return false;
  return canAccessBrain(session.profile.accessLevel);
}
