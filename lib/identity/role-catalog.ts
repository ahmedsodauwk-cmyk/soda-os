/**
 * Role / permission catalog readers for Founder RBAC UI.
 * Does not create users — only reads DB catalogs.
 */

import { createClient } from "@/lib/supabase/server";
import { PERMISSIONS, type Permission } from "@/lib/identity/permissions";
import { SODA_ROLES, ROLE_LABELS, type SodaRole } from "@/lib/identity/roles";
import {
  groupPermissionsByGroup as groupByTemplate,
  PERMISSION_GROUPS,
  type PermissionGroup,
} from "@/lib/identity/role-templates";

export { groupPermissionsByGroup } from "@/lib/identity/role-templates";

export type RoleCatalogRow = {
  id: string;
  label: string;
  description: string | null;
};

export type PermissionCatalogRow = {
  id: string;
  label: string;
  permissionGroup: string | null;
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
      .select("id, label, permission_group")
      .order("id");
    if (error || !data) {
      return PERMISSIONS.map((id) => ({
        id,
        label: id,
        permissionGroup: null,
      }));
    }
    return data.map((row) => ({
      id: String(row.id),
      label: String(row.label),
      permissionGroup:
        typeof row.permission_group === "string"
          ? row.permission_group
          : null,
    }));
  } catch {
    return PERMISSIONS.map((id) => ({
      id,
      label: id,
      permissionGroup: null,
    }));
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

export function isPermissionGroup(value: string): value is PermissionGroup {
  return (PERMISSION_GROUPS as readonly string[]).includes(value);
}

/** Typed wrapper — same as template helper. */
export function groupPermissionCatalog(
  permissions: PermissionCatalogRow[]
): { group: string; permissions: PermissionCatalogRow[] }[] {
  return groupByTemplate(permissions) as {
    group: string;
    permissions: PermissionCatalogRow[];
  }[];
}
