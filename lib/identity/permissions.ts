/**
 * Permission maps — legacy role fallbacks + helpers.
 *
 * @deprecated Prefer Access Level via `lib/identity/access-levels.ts` and
 * `permission-service.ts`. Authorization SoT is Access Level — never elevates
 * unresolved lookups to Founder/owner.
 */

import {
  accessLevelCan,
  permissionsForAccessLevel,
  resolveAccessLevel,
  type AccessLevel,
} from "@/lib/identity/access-levels";
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

/**
 * Resolve grants for a role OR access-level string.
 * Always goes through Access Level — never elevates unknowns to Founder.
 */
function levelOf(roleOrLevel: AccessLevel | SodaRole | string): AccessLevel {
  return resolveAccessLevel({
    accessLevel: roleOrLevel,
    role: roleOrLevel,
  });
}

/** @deprecated Prefer `permissionsForAsync` / Access Level. */
export function permissionsFor(
  roleOrLevel: AccessLevel | SodaRole | string
): readonly Permission[] {
  return permissionsForAccessLevel(levelOf(roleOrLevel));
}

/**
 * Sync permission check — Access Level resolution (no owner fallback).
 * @deprecated Prefer `canAsync` / `sessionCan` on the server.
 */
export function can(
  roleOrLevel: AccessLevel | SodaRole | string,
  permission: Permission
): boolean {
  return accessLevelCan(levelOf(roleOrLevel), permission);
}

export function canAny(
  roleOrLevel: AccessLevel | SodaRole | string,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => can(roleOrLevel, p));
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

/** Operational mutation (create/edit/delete). */
export function canEditOps(
  roleOrLevel: AccessLevel | SodaRole | string
): boolean {
  return can(roleOrLevel, "orders.edit") || can(roleOrLevel, "projects.edit");
}

/** Edit agreed price / deposit / financial fields on an order. */
export function canEditOrderFinance(
  roleOrLevel: AccessLevel | SodaRole | string
): boolean {
  return can(roleOrLevel, "orders.finance");
}

/** Update operational order status (incl. crew: started / completed / delivered). */
export function canUpdateOrderStatus(
  roleOrLevel: AccessLevel | SodaRole | string
): boolean {
  return can(roleOrLevel, "orders.status") || can(roleOrLevel, "orders.edit");
}

export function canSeeCompanyFinance(
  roleOrLevel: AccessLevel | SodaRole | string
): boolean {
  return (
    can(roleOrLevel, "finance.view") || can(roleOrLevel, "dashboard.finance")
  );
}

/** People OS directory / profile visibility. */
export function canViewPeople(
  roleOrLevel: AccessLevel | SodaRole | string
): boolean {
  return (
    can(roleOrLevel, "people.view") ||
    can(roleOrLevel, "crew.view") ||
    can(roleOrLevel, "crew.stats")
  );
}
