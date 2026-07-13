/**
 * Permission service — DB `roles` / `permissions` / `role_permissions` is the
 * long-term Source of Truth for Founder-assignable permissions.
 *
 * Hardcoded maps in `permissions.ts` are DEPRECATED fallbacks when:
 * - migration not applied
 * - RPC / table read fails
 * - client components need a sync check
 *
 * Prefer `canAsync` / `permissionsForAsync` on the server.
 * Founder assignment path: mutate `role_permissions` (Authority Center).
 */

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { SodaRole } from "@/lib/identity/roles";
import {
  can as canHardcoded,
  permissionsFor as permissionsForHardcoded,
  type Permission,
  PERMISSIONS,
} from "@/lib/identity/permissions";

export type PermissionSource = "database" | "hardcoded-fallback";

export type PermissionCheckResult = {
  allowed: boolean;
  source: PermissionSource;
};

const dbCache = new Map<SodaRole, Set<string>>();

async function loadRolePermissionsFromDb(
  role: SodaRole
): Promise<Set<string> | null> {
  const cached = dbCache.get(role);
  if (cached) return cached;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("role_permissions")
      .select("permission_id")
      .eq("role_id", role);

    if (error || !data) return null;

    const set = new Set(
      data
        .map((row) =>
          typeof row.permission_id === "string" ? row.permission_id : null
        )
        .filter((id): id is string => Boolean(id))
    );
    dbCache.set(role, set);
    return set;
  } catch {
    return null;
  }
}

/** Clear in-memory DB permission cache (after Founder edits role_permissions). */
export function invalidatePermissionCache(role?: SodaRole): void {
  if (role) dbCache.delete(role);
  else dbCache.clear();
}

/**
 * Async permission check — reads DB first, falls back to deprecated hardcoded map.
 */
export async function canAsync(
  role: SodaRole,
  permission: Permission
): Promise<PermissionCheckResult> {
  const fromDb = await loadRolePermissionsFromDb(role);
  if (fromDb && fromDb.size > 0) {
    return {
      allowed: fromDb.has(permission),
      source: "database",
    };
  }
  return {
    allowed: canHardcoded(role, permission),
    source: "hardcoded-fallback",
  };
}

export async function permissionsForAsync(
  role: SodaRole
): Promise<{ permissions: readonly Permission[]; source: PermissionSource }> {
  const fromDb = await loadRolePermissionsFromDb(role);
  if (fromDb && fromDb.size > 0) {
    const list = PERMISSIONS.filter((p) => fromDb.has(p));
    return { permissions: list, source: "database" };
  }
  return {
    permissions: permissionsForHardcoded(role),
    source: "hardcoded-fallback",
  };
}

/** Per-request helper for session gates. */
export const sessionCanAsync = cache(
  async (
    role: SodaRole,
    permission: Permission
  ): Promise<boolean> => {
    const result = await canAsync(role, permission);
    return result.allowed;
  }
);

/**
 * Assign a permission to a role (Founder / Owner path).
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
    invalidatePermissionCache(roleId as SodaRole);
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
    invalidatePermissionCache(roleId as SodaRole);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Revoke failed",
    };
  }
}
