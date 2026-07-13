/**
 * Permission maps — what each role can see and do.
 * Isolates finance, ops edit, and crew-only surfaces.
 *
 * @deprecated Hardcoded ROLE_PERMISSIONS are a **fallback only**.
 * Long-term Source of Truth: DB `roles` / `permissions` / `role_permissions`
 * via `lib/identity/permission-service.ts` (`canAsync`, Founder assign/revoke).
 * Keep this file until all call sites migrate off sync `can()`.
 */

import type { SodaRole } from "@/lib/identity/roles";

export const PERMISSIONS = [
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
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL: Permission[] = [...PERMISSIONS];

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
  "crew.manage",
  "people.view",
  "work.assign",
  "clients.manage",
  "calendar.view",
  "calendar.edit",
  "calendar.manage",
  "notifications.view",
  "me.performance",
];

const CREW: Permission[] = [
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

const ACCOUNTANT: Permission[] = [
  "dashboard.finance",
  "finance.view",
  "finance.edit",
  "finance.reports",
  "payments.view",
  "payments.edit",
  "payments.approve",
  "expenses.view",
  "expenses.edit",
  "expenses.create",
  "reports.view",
  "reports.manage",
  "orders.view",
  "clients.view",
  "notifications.view",
  "statistics.view",
];

const CLIENT: Permission[] = ["notifications.view"];

const SALES: Permission[] = [
  "dashboard.company",
  "orders.view",
  "orders.create",
  "projects.view",
  "clients.view",
  "clients.edit",
  "clients.manage",
  "quotations.view",
  "quotations.edit",
  "commercial.view",
  "calendar.view",
  "notifications.view",
];

const CUSTOMER_SERVICE: Permission[] = [
  "orders.view",
  "clients.view",
  "projects.view",
  "calendar.view",
  "notifications.view",
];

const SOCIAL_MEDIA: Permission[] = [
  "social.view",
  "social.edit",
  "content.publish",
  "calendar.view",
  "notifications.view",
  "projects.view",
  "orders.view",
];

/** Admin = Manager: ops edit + Authority Center; no order finance unless Founder grants. */
const ADMIN: Permission[] = ALL.filter((p) => p !== "orders.finance");

/** @deprecated Prefer DB role_permissions via permission-service. */
const ROLE_PERMISSIONS: Record<SodaRole, readonly Permission[]> = {
  owner: ALL,
  founder: ALL,
  admin: ADMIN,
  team_leader: TEAM_LEADER,
  project_manager: TEAM_LEADER,
  crew_member: CREW,
  photographer: CREW,
  videographer: CREW,
  photo_editor: CREW,
  video_editor: CREW,
  freelancer: CREW,
  social_media_manager: SOCIAL_MEDIA,
  accountant: ACCOUNTANT,
  sales: SALES,
  customer_service: CUSTOMER_SERVICE,
  client: CLIENT,
  guest: CLIENT,
};

/** @deprecated Prefer `permissionsForAsync` from permission-service. */
export function permissionsFor(role: SodaRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Sync permission check (hardcoded fallback).
 * @deprecated Prefer `canAsync` / `sessionCanAsync` from permission-service on the server.
 */
export function can(role: SodaRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canAny(role: SodaRole, permissions: Permission[]): boolean {
  return permissions.some((p) => can(role, p));
}

/** Check against an explicit permission set (DB-backed nav filtering). */
export function setHasAny(
  granted: ReadonlySet<string> | readonly string[],
  permissions: readonly Permission[]
): boolean {
  const set =
    granted instanceof Set ? granted : new Set(granted as readonly string[]);
  return permissions.some((p) => set.has(p));
}

/** Operational mutation (create/edit/delete) — accountants and clients blocked. */
export function canEditOps(role: SodaRole): boolean {
  return can(role, "orders.edit") || can(role, "projects.edit");
}

/** Edit agreed price / deposit / financial fields on an order. Owner only. */
export function canEditOrderFinance(role: SodaRole): boolean {
  return can(role, "orders.finance");
}

/** Update operational order status (incl. crew: started / completed / delivered). */
export function canUpdateOrderStatus(role: SodaRole): boolean {
  return can(role, "orders.status") || can(role, "orders.edit");
}

export function canSeeCompanyFinance(role: SodaRole): boolean {
  return can(role, "finance.view") || can(role, "dashboard.company");
}

/** People OS directory / profile visibility. */
export function canViewPeople(role: SodaRole): boolean {
  return can(role, "people.view") || can(role, "crew.view") || can(role, "crew.stats");
}
