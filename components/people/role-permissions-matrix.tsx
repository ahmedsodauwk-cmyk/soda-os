"use client";

import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { toggleRolePermissionAction } from "@/lib/identity/role-actions";
import type {
  PermissionCatalogRow,
  RoleCatalogRow,
} from "@/lib/identity/role-catalog";
import {
  groupPermissionsByGroup,
  PERMISSION_GROUPS,
} from "@/lib/identity/role-templates";

interface RolePermissionsMatrixProps {
  roles: RoleCatalogRow[];
  permissions: PermissionCatalogRow[];
  /** roleId → permission ids currently granted */
  matrix: Record<string, string[]>;
}

/**
 * Founder RBAC — assign/revoke DB permissions, grouped by permission_group.
 * Does not create users.
 */
export function RolePermissionsMatrix({
  roles,
  permissions,
  matrix,
}: RolePermissionsMatrixProps) {
  const [pending, startTransition] = useTransition();
  const groups = groupPermissionsByGroup(permissions);

  function onToggle(roleId: string, permissionId: string, next: boolean) {
    startTransition(async () => {
      await toggleRolePermissionAction(roleId, permissionId, next);
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-primary/80 uppercase">
          SODA VISUALS · Customize Permissions
        </p>
        <p className="text-sm text-muted-foreground">
          Database <code className="text-xs">role_permissions</code> is the
          Source of Truth. Groups: {PERMISSION_GROUPS.join(", ")}.
        </p>
        {pending ? (
          <p className="text-xs text-muted-foreground">Saving…</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {roles.map((role) => (
          <Badge key={role.id} variant="outline">
            {role.label}
          </Badge>
        ))}
      </div>

      <div className="space-y-10">
        {roles.map((role) => {
          const granted = new Set(matrix[role.id] ?? []);
          return (
            <section
              key={role.id}
              className="space-y-4 rounded-2xl border border-border/60 bg-card/30 p-4"
            >
              <div>
                <h3 className="font-heading text-base font-semibold">
                  {role.label}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {role.description ?? role.id}
                </p>
              </div>

              {groups.map(({ group, permissions: perms }) => (
                <div key={`${role.id}-${group}`} className="space-y-2">
                  <p className="text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                    {group}
                  </p>
                  <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {perms.map((perm) => {
                      const checked = granted.has(perm.id);
                      return (
                        <li key={perm.id}>
                          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/40 px-2.5 py-2 text-sm hover:border-primary/30">
                            <input
                              type="checkbox"
                              className="mt-0.5"
                              checked={checked}
                              disabled={pending}
                              onChange={(e) =>
                                onToggle(role.id, perm.id, e.target.checked)
                              }
                            />
                            <span>
                              <span className="font-medium">{perm.label}</span>
                              <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                                {perm.id}
                              </span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
