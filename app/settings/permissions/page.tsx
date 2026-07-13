import { redirect } from "next/navigation";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { RoleGate } from "@/components/identity/role-gate";
import { RolePermissionsMatrix } from "@/components/people/role-permissions-matrix";
import { Button } from "@/components/ui/button";
import {
  listPermissionsFromDb,
  listRolesFromDb,
  loadRolePermissionMatrix,
} from "@/lib/identity/role-catalog";
import { resolveSessionForApp } from "@/lib/identity/session";

export const dynamic = "force-dynamic";

export default async function PermissionsSettingsPage() {
  const session = await resolveSessionForApp();
  if (!session) redirect("/login");

  const [roles, permissions, matrixSets] = await Promise.all([
    listRolesFromDb(),
    listPermissionsFromDb(),
    loadRolePermissionMatrix(),
  ]);

  const matrix: Record<string, string[]> = {};
  for (const [roleId, set] of Object.entries(matrixSets)) {
    matrix[roleId] = [...set].sort();
  }

  return (
    <AppShell titleKey="pages.settings" layer="settings" session={session}>
      <RoleGate session={session} anyOf={["settings.users"]}>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/settings" />}
              className="-ml-2"
            >
              ← Settings
            </Button>
          </div>
          <RolePermissionsMatrix
            roles={roles}
            permissions={permissions}
            matrix={matrix}
          />
        </div>
      </RoleGate>
    </AppShell>
  );
}
