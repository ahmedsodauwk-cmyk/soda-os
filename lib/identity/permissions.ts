/**
 * Permission maps — what each role can see and do.
 * Isolates finance, ops edit, and crew-only surfaces.
 */

import type { SodaRole } from "@/lib/identity/roles";

export const PERMISSIONS = [
  "dashboard.company",
  "dashboard.team",
  "dashboard.crew",
  "dashboard.finance",
  "orders.view",
  "orders.edit",
  "projects.view",
  "projects.edit",
  "clients.view",
  "clients.edit",
  "crew.view",
  "crew.edit",
  "crew.stats",
  "equipment.view",
  "equipment.edit",
  "calendar.view",
  "calendar.edit",
  "finance.view",
  "finance.edit",
  "finance.reports",
  "quotations.view",
  "quotations.edit",
  "commercial.view",
  "statistics.view",
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
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL: Permission[] = [...PERMISSIONS];

const TEAM_LEADER: Permission[] = [
  "dashboard.team",
  "orders.view",
  "orders.edit",
  "projects.view",
  "projects.edit",
  "crew.view",
  "crew.stats",
  "calendar.view",
  "calendar.edit",
  "notifications.view",
  "me.performance",
];

const CREW: Permission[] = [
  "dashboard.crew",
  "orders.view",
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

const ACCOUNTANT: Permission[] = [
  "dashboard.finance",
  "finance.view",
  "finance.reports",
  "orders.view",
  "clients.view",
  "notifications.view",
  "statistics.view",
];

const CLIENT: Permission[] = ["notifications.view"];

const ADMIN: Permission[] = ALL.filter((p) => p !== "settings.users");

const ROLE_PERMISSIONS: Record<SodaRole, readonly Permission[]> = {
  owner: ALL,
  admin: ADMIN,
  team_leader: TEAM_LEADER,
  crew_member: CREW,
  accountant: ACCOUNTANT,
  client: CLIENT,
};

export function permissionsFor(role: SodaRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function can(role: SodaRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canAny(role: SodaRole, permissions: Permission[]): boolean {
  return permissions.some((p) => can(role, p));
}

/** Operational mutation (create/edit/delete) — accountants and clients blocked. */
export function canEditOps(role: SodaRole): boolean {
  return can(role, "orders.edit") || can(role, "projects.edit");
}

export function canSeeCompanyFinance(role: SodaRole): boolean {
  return can(role, "finance.view") || can(role, "dashboard.company");
}
