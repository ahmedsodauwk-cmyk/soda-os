/**
 * Role / permission catalog readers for Founder RBAC UI.
 * Does not create users — only reads DB catalogs.
 */

import { createClient } from "@/lib/supabase/server";
import { PERMISSIONS, type Permission } from "@/lib/identity/permissions";
import { SODA_ROLES, ROLE_LABELS, type SodaRole } from "@/lib/identity/roles";

export type RoleCatalogRow = {
  id: string;
  label: string;
  description: string | null;
};

export type PermissionCatalogRow = {
  id: string;
  label: string;
};

export async function listRolesFromDb(): Promise<RoleCatalogRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("roles")
      .select("id, label, description")
      .order("label");
    if (error || !data) {
      return SODA_ROLES.map((id) => ({
        id,
        label: ROLE_LABELS[id],
        description: null,
      }));
    }
    return data.map((row) => ({
      id: String(row.id),
      label: String(row.label),
      description:
        typeof row.description === "string" ? row.description : null,
    }));
  } catch {
    return SODA_ROLES.map((id) => ({
      id,
      label: ROLE_LABELS[id],
      description: null,
    }));
  }
}

export async function listPermissionsFromDb(): Promise<PermissionCatalogRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("permissions")
      .select("id, label")
      .order("id");
    if (error || !data) {
      return PERMISSIONS.map((id) => ({ id, label: id }));
    }
    return data.map((row) => ({
      id: String(row.id),
      label: String(row.label),
    }));
  } catch {
    return PERMISSIONS.map((id) => ({ id, label: id }));
  }
}

/** Map of role_id → set of permission_id from DB. */
export async function loadRolePermissionMatrix(): Promise<
  Record<string, Set<string>>
> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("role_permissions")
      .select("role_id, permission_id");
    if (error || !data) return {};
    const matrix: Record<string, Set<string>> = {};
    for (const row of data) {
      const roleId = typeof row.role_id === "string" ? row.role_id : null;
      const permId =
        typeof row.permission_id === "string" ? row.permission_id : null;
      if (!roleId || !permId) continue;
      if (!matrix[roleId]) matrix[roleId] = new Set();
      matrix[roleId].add(permId);
    }
    return matrix;
  } catch {
    return {};
  }
}

export function isKnownPermission(id: string): id is Permission {
  return (PERMISSIONS as readonly string[]).includes(id);
}

export function isKnownRole(id: string): id is SodaRole {
  return (SODA_ROLES as readonly string[]).includes(id);
}
