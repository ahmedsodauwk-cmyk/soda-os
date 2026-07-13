/**
 * Crew Workspace founder / admin capability gates (Mission 04.4.1).
 * Unauthorized users must never see Founder Actions.
 */

import type { SodaRole } from "@/lib/identity/roles";
import { can } from "@/lib/identity/permissions";

const FOUNDER_ACTION_ROLES = new Set<SodaRole>([
  "owner",
  "founder",
  "admin",
]);

/** Session may see Founder Actions in Crew Workspace. */
export function canSeeFounderActions(
  role: SodaRole | null | undefined
): boolean {
  if (!role) return false;
  if (!FOUNDER_ACTION_ROLES.has(role)) return false;
  return can(role, "people.edit") || can(role, "crew.edit");
}

/** Same gate — edit / assign / archive mutations. */
export function canMutateCrewProfile(
  role: SodaRole | null | undefined
): boolean {
  return canSeeFounderActions(role);
}
