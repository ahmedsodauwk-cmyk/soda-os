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
import {
  PERMISSIONS,
  type Permission,
} from "@/lib/identity/permission-ids";
import type { SodaRole } from "@/lib/identity/roles";

export { PERMISSIONS, type Permission };

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
