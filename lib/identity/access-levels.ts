/**
 * Access Level Engine (Mission 04.4.5).
 *
 * Access Level = what the person can access (authorization).
 * Job Title / Role = what the person does (display / ops identity) — NEVER drives permissions.
 *
 * Unresolved auth MUST deny — never elevate to Founder/owner.
 */

import type { Permission } from "@/lib/identity/permission-ids";
import type { SodaRole } from "@/lib/identity/roles";

export const ACCESS_LEVELS = [
  "founder",
  "account_manager",
  "team_leader",
  "team",
] as const;

export type AccessLevel = (typeof ACCESS_LEVELS)[number];

export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  founder: "Founder",
  account_manager: "Account Manager",
  team_leader: "Team Leader",
  team: "Team",
};

/** Selectable when creating Login Accounts — Founder is Owner/manual only. */
export const INVITEABLE_ACCESS_LEVELS: readonly AccessLevel[] = [
  "team",
  "team_leader",
  "account_manager",
];

/**
 * Levels a Founder may assign via Create Login / Access Level editor.
 * Founder itself is never assignable (Owner/manual only).
 */
export function isAssignableAccessLevel(
  level: AccessLevel | string | null | undefined
): boolean {
  return (
    !!level &&
    (INVITEABLE_ACCESS_LEVELS as readonly string[]).includes(level)
  );
}

const ALL: Permission[] = [
  "dashboard.company",
  "dashboard.team",
  "dashboard.crew",
  "dashboard.finance",
  "orders.view",
  "orders.create",
  "orders.edit",
  "orders.approve",
  "orders.delete",
  "orders.status",
  "orders.finance",
  "projects.view",
  "projects.edit",
  "clients.view",
  "clients.edit",
  "clients.manage",
  "crew.view",
  "crew.edit",
  "crew.stats",
  "crew.manage",
  "people.view",
  "people.edit",
  "work.assign",
  "equipment.view",
  "equipment.edit",
  "calendar.view",
  "calendar.edit",
  "calendar.manage",
  "finance.view",
  "finance.edit",
  "finance.reports",
  "payments.view",
  "payments.edit",
  "payments.approve",
  "expenses.view",
  "expenses.edit",
  "expenses.create",
  "quotations.view",
  "quotations.edit",
  "commercial.view",
  "reports.view",
  "reports.manage",
  "statistics.view",
  "social.view",
  "social.edit",
  "content.publish",
  "settings.view",
  "settings.users",
  "notifications.view",
  "me.wallet",
  "me.bonus",
  "me.target",
  "me.penalties",
  "me.files",
  "me.briefs",
  "me.dress_code",
  "me.performance",
  "brain.view",
  "brain.edit",
];

/** Account Manager — quotes/orders/clients/commercial/calendar/assign; no Authority/Finance/Settings. */
const ACCOUNT_MANAGER: Permission[] = [
  "dashboard.company",
  "orders.view",
  "orders.create",
  "orders.edit",
  "orders.approve",
  "orders.status",
  "projects.view",
  "clients.view",
  "clients.edit",
  "clients.manage",
  "work.assign",
  "calendar.view",
  "calendar.edit",
  "quotations.view",
  "quotations.edit",
  "commercial.view",
  "notifications.view",
];

/** Team Leader — orders, assign, crew workspace, calendar; no Authority/Finance/user creation. */
const TEAM_LEADER: Permission[] = [
  "dashboard.team",
  "orders.view",
  "orders.create",
  "orders.edit",
  "orders.approve",
  "orders.status",
  "projects.view",
  "projects.edit",
  "crew.view",
  "crew.stats",
  "people.view",
  "work.assign",
  "clients.view",
  "calendar.view",
  "calendar.edit",
  "calendar.manage",
  "notifications.view",
  "me.performance",
];

/** Team — personal workspace only; no company management modules. */
const TEAM: Permission[] = [
  "dashboard.crew",
  "orders.view",
  "orders.status",
  "calendar.view",
  "notifications.view",
  "me.wallet",
  "me.bonus",
  "me.target",
  "me.penalties",
  "me.files",
  "me.briefs",
  "me.dress_code",
  "me.performance",
];

/** Hardcoded Access Level → permission sets (DB templates preferred when present). */
export const ACCESS_LEVEL_PERMISSIONS: Record<
  AccessLevel,
  readonly Permission[]
> = {
  founder: ALL,
  account_manager: ACCOUNT_MANAGER,
  team_leader: TEAM_LEADER,
  team: TEAM,
};

export function isAccessLevel(
  value: string | null | undefined
): value is AccessLevel {
  return !!value && (ACCESS_LEVELS as readonly string[]).includes(value);
}

/**
 * Parse access level. Returns null when unresolved — callers MUST deny, never elevate.
 */
export function parseAccessLevel(
  value: string | null | undefined
): AccessLevel | null {
  return isAccessLevel(value) ? value : null;
}

/**
 * Map legacy profile.role → Access Level for backfill / migration only.
 * Unknown roles → team (never founder).
 */
export function accessLevelFromLegacyRole(
  role: string | null | undefined
): AccessLevel {
  switch (role) {
    case "owner":
    case "founder":
    case "admin":
      return "founder";
    case "sales":
    case "customer_service":
      return "account_manager";
    case "team_leader":
    case "project_manager":
      return "team_leader";
    default:
      return "team";
  }
}

/** Resolve access level from column or legacy role — never invents founder for nulls. */
export function resolveAccessLevel(input: {
  accessLevel?: string | null;
  role?: string | null;
}): AccessLevel {
  const fromCol = parseAccessLevel(input.accessLevel);
  if (fromCol) return fromCol;
  return accessLevelFromLegacyRole(input.role);
}

export function permissionsForAccessLevel(
  level: AccessLevel | string | null | undefined
): readonly Permission[] {
  const key = parseAccessLevel(level) ?? "team";
  return ACCESS_LEVEL_PERMISSIONS[key] ?? ACCESS_LEVEL_PERMISSIONS.team;
}

export function accessLevelCan(
  level: AccessLevel | string | null | undefined,
  permission: Permission
): boolean {
  return permissionsForAccessLevel(level).includes(permission);
}

export function isFounderAccess(level: AccessLevel): boolean {
  return level === "founder";
}

/** Roles that historically meant Authority operators — for display mapping only. */
export function sodaRoleSuggestsFounderAccess(role: SodaRole): boolean {
  return role === "owner" || role === "founder" || role === "admin";
}
