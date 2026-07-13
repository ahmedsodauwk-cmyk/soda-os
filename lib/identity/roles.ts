/**
 * SODA identity roles — workspace visibility + permission keys.
 *
 * Legacy keys (owner, admin, team_leader, crew_member, accountant, client)
 * remain valid for existing profiles.
 *
 * People OS / Operational Authority roles are ADDITIVE — Founder-facing
 * templates for crew provisioning. DB `roles` / `role_permissions` is SoT.
 */

export const SODA_ROLES = [
  /* Legacy */
  "owner",
  "admin",
  "team_leader",
  "crew_member",
  "accountant",
  "client",
  /* Operational Authority (Mission 04.4 / 04.4.2) */
  "founder",
  "project_manager",
  "photographer",
  "videographer",
  "photo_editor",
  "video_editor",
  "social_media_manager",
  "sales",
  "customer_service",
  "freelancer",
  "guest",
] as const;

export type SodaRole = (typeof SODA_ROLES)[number];

export const ROLE_LABELS: Record<SodaRole, string> = {
  owner: "Owner",
  admin: "Admin",
  team_leader: "Team Leader",
  crew_member: "Crew Member",
  accountant: "Accountant",
  client: "Client",
  founder: "Founder",
  project_manager: "Project Manager",
  photographer: "Photographer",
  videographer: "Videographer",
  photo_editor: "Photo Editor",
  video_editor: "Video Editor",
  social_media_manager: "Social Media Manager",
  sales: "Sales",
  customer_service: "Customer Service",
  freelancer: "Freelancer",
  guest: "Guest",
};

/** Roles safe to offer on invite / Create Account (exclude portal/guest). */
export const INVITEABLE_ROLES: readonly SodaRole[] = SODA_ROLES.filter(
  (r) => r !== "client" && r !== "guest"
);

/**
 * Conceptual legacy → Operational mapping (documentation + soft normalize).
 * Does not rewrite stored profile.role unless Founder migrates explicitly.
 */
export const LEGACY_ROLE_EQUIVALENTS: Partial<
  Record<SodaRole, readonly SodaRole[]>
> = {
  owner: ["founder"],
  founder: ["owner"],
  team_leader: ["project_manager"],
  project_manager: ["team_leader"],
  crew_member: [
    "photographer",
    "videographer",
    "photo_editor",
    "video_editor",
    "freelancer",
  ],
  client: ["guest"],
  guest: ["client"],
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

/** Founder / Owner / Admin — Authority Center operators. */
export function isAuthorityOperator(role: SodaRole): boolean {
  return role === "owner" || role === "founder" || role === "admin";
}
