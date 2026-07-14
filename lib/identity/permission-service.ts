/**
 * Permission service — Access Level → grants (Mission 04.4.5).
 *
 * Lookup key is `profiles.access_level` (founder | account_manager |
 * team_leader | team), not job title / operational role.
 *
 * DB `role_permissions` rows keyed by access_level id are Source of Truth.
 * Hardcoded ACCESS_LEVEL_PERMISSIONS is fallback when DB empty/unavailable.
 * NEVER elevates unresolved lookups to Founder/owner.
 */

import { cache } from "react";

import {
  accessLevelCan,
  isAccessLevel,
  permissionsForAccessLevel,
  resolveAccessLevel,
  type AccessLevel,
} from "@/lib/identity/access-levels";
import { createClient } from "@/lib/supabase/server";
import type { SodaRole } from "@/lib/identity/roles";
import { PERMISSIONS, type Permission } from "@/lib/identity/permission-ids";

export type PermissionSource = "database" | "hardcoded-fallback";

export type PermissionCheckResult = {
  allowed: boolean;
  source: PermissionSource;
};

const dbCache = new Map<string, Set<string>>();

/**
 * Normalize a role-or-access-level argument to Access Level.
 * Legacy SodaRole strings map via resolveAccessLevel — unknowns → team.
 */
export function toAccessLevelKey(
  roleOrLevel: AccessLevel | SodaRole | string
): AccessLevel {
  try {
    if (isAccessLevel(roleOrLevel)) return roleOrLevel;
    return resolveAccessLevel({ role: roleOrLevel });
  } catch {
    return "team";
  }
}

async function loadAccessPermissionsFromDb(
  level: AccessLevel
): Promise<Set<string> | null> {
  const cached = dbCache.get(level);
  if (cached) return cached;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("role_permissions")
      .select("permission_id")
      .eq("role_id", level);

    if (error || !data) return null;

    const set = new Set(
      data
        .map((row) =>
          typeof row.permission_id === "string" ? row.permission_id : null
        )
        .filter((id): id is string => Boolean(id))
    );
    dbCache.set(level, set);
    return set;
  } catch {
    return null;
  }
}

/** Clear in-memory DB permission cache (after Founder edits role_permissions). */
export function invalidatePermissionCache(roleOrLevel?: string): void {
  if (roleOrLevel) dbCache.delete(roleOrLevel);
  else dbCache.clear();
}

/**
 * Async permission check — Access Level → DB first, then hardcoded map.
 * Unresolved / empty DB uses Team-safe hardcoded set for that level — never Founder.
 */
export async function canAsync(
  roleOrLevel: AccessLevel | SodaRole | string,
  permission: Permission
): Promise<PermissionCheckResult> {
  try {
    const level = toAccessLevelKey(roleOrLevel);
    const fromDb = await loadAccessPermissionsFromDb(level);
    if (fromDb && fromDb.size > 0) {
      return {
        allowed: fromDb.has(permission),
        source: "database",
      };
    }
    return {
      allowed: accessLevelCan(level, permission),
      source: "hardcoded-fallback",
    };
  } catch {
    // Never throw into RSC — deny carefully (no Founder elevation).
    return { allowed: false, source: "hardcoded-fallback" };
  }
}

export async function permissionsForAsync(
  roleOrLevel: AccessLevel | SodaRole | string
): Promise<{ permissions: readonly Permission[]; source: PermissionSource }> {
  try {
    const level = toAccessLevelKey(roleOrLevel);
    const fromDb = await loadAccessPermissionsFromDb(level);
    if (fromDb && fromDb.size > 0) {
      const list = PERMISSIONS.filter((p) => fromDb.has(p));
      // Empty filter (id mismatch) must not crash AppShell spreads — fall back.
      if (list.length > 0) {
        return { permissions: list, source: "database" };
      }
    }
    return {
      permissions: permissionsForAccessLevel(level),
      source: "hardcoded-fallback",
    };
  } catch {
    return {
      permissions: permissionsForAccessLevel("team"),
      source: "hardcoded-fallback",
    };
  }
}

/** Per-request helper for session gates. */
export const sessionCanAsync = cache(
  async (
    roleOrLevel: AccessLevel | SodaRole | string,
    permission: Permission
  ): Promise<boolean> => {
    const result = await canAsync(roleOrLevel, permission);
    return result.allowed;
  }
);

/**
 * Assign a permission to an access-level / role template (Founder path).
 * Does not create users — only mutates role_permissions.
 */
export async function assignRolePermission(
  roleId: string,
  permissionId: Permission
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("role_permissions").upsert(
      { role_id: roleId, permission_id: permissionId },
      { onConflict: "role_id,permission_id" }
    );
    if (error) return { ok: false, error: error.message };
    invalidatePermissionCache(roleId);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Assign failed",
    };
  }
}

export async function revokeRolePermission(
  roleId: string,
  permissionId: Permission
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("role_permissions")
      .delete()
      .eq("role_id", roleId)
      .eq("permission_id", permissionId);
    if (error) return { ok: false, error: error.message };
    invalidatePermissionCache(roleId);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Revoke failed",
    };
  }
}
