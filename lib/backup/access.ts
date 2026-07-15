/**
 * Founder-only gate for Backup Center (Mission 08.0).
 */

import { isFounderAccess } from "@/lib/identity/access-levels";
import { resolveSessionForApp, type SodaSession } from "@/lib/identity/session";

export async function requireBackupFounder(): Promise<SodaSession | null> {
  const session = await resolveSessionForApp();
  if (!session) return null;
  if (!isFounderAccess(session.profile.accessLevel)) return null;
  return session;
}

export function canAccessBackupCenter(
  accessLevel: string | null | undefined
): boolean {
  return accessLevel === "founder";
}
