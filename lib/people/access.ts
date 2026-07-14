/**
 * Crew Workspace founder capability gates (Mission 04.4.1 / 04.4.5).
 * Gates on Access Level — never job title. Unauthorized users never see Founder Actions.
 */

import {
  accessLevelCan,
  isFounderAccess,
  type AccessLevel,
} from "@/lib/identity/access-levels";

/** Session may see Founder Actions in Crew Workspace. */
export function canSeeFounderActions(
  accessLevel: AccessLevel | null | undefined
): boolean {
  if (!accessLevel) return false;
  if (!isFounderAccess(accessLevel)) return false;
  return (
    accessLevelCan(accessLevel, "people.edit") ||
    accessLevelCan(accessLevel, "crew.edit") ||
    accessLevelCan(accessLevel, "settings.users")
  );
}

/** Same gate — edit / assign / archive mutations. */
export function canMutateCrewProfile(
  accessLevel: AccessLevel | null | undefined
): boolean {
  return canSeeFounderActions(accessLevel);
}
