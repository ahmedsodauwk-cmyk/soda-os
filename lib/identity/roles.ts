/**
 * SODA identity roles — workspace visibility + permission keys.
 */

export const SODA_ROLES = [
  "owner",
  "admin",
  "team_leader",
  "crew_member",
  "accountant",
  "client",
] as const;

export type SodaRole = (typeof SODA_ROLES)[number];

export const ROLE_LABELS: Record<SodaRole, string> = {
  owner: "Owner",
  admin: "Admin",
  team_leader: "Team Leader",
  crew_member: "Crew Member",
  accountant: "Accountant",
  client: "Client",
};

export function isSodaRole(value: string | null | undefined): value is SodaRole {
  return !!value && (SODA_ROLES as readonly string[]).includes(value);
}

export function parseSodaRole(
  value: string | null | undefined,
  fallback: SodaRole = "crew_member"
): SodaRole {
  return isSodaRole(value) ? value : fallback;
}
