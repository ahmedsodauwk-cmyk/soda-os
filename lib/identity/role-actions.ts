"use server";

import {
  assignRolePermission,
  revokeRolePermission,
} from "@/lib/identity/permission-service";
import { can } from "@/lib/identity/permissions";
import type { Permission } from "@/lib/identity/permissions";
import { resolveSessionForApp } from "@/lib/identity/session";
import { revalidatePath } from "next/cache";

export type RolePermissionActionResult = {
  ok: boolean;
  error?: string;
};

/**
 * Founder toggles a permission on a role.
 * Does not create Auth users or people records.
 */
export async function toggleRolePermissionAction(
  roleId: string,
  permissionId: string,
  enabled: boolean
): Promise<RolePermissionActionResult> {
  const session = await resolveSessionForApp();
  if (!session || !can(session.profile.accessLevel, "settings.users")) {
    return { ok: false, error: "Not authorized" };
  }

  const result = enabled
    ? await assignRolePermission(roleId, permissionId as Permission)
    : await revokeRolePermission(roleId, permissionId as Permission);

  if (result.ok) {
    revalidatePath("/settings/permissions");
    revalidatePath("/settings/authority");
  }
  return result;
}
