import { redirect } from "next/navigation";
import Link from "next/link";

import { AccountDirectory } from "@/components/authority/account-directory";
import { AppShell } from "@/components/layout/app-shell";
import { RoleGate } from "@/components/identity/role-gate";
import { RolePermissionsMatrix } from "@/components/people/role-permissions-matrix";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listAuthorityAccounts } from "@/lib/identity/authority-actions";
import {
  listPermissionsFromDb,
  listRolesFromDb,
  loadRolePermissionMatrix,
} from "@/lib/identity/role-catalog";
import { ROLE_TEMPLATES } from "@/lib/identity/role-templates";
import { resolveSessionForApp } from "@/lib/identity/session";

export const dynamic = "force-dynamic";

/**
 * Founder Authority Center — existing accounts, roles, permissions.
 * Account creation lives in Crew Workspace only (Mission 04.4.3).
 */
export default async function AuthorityCenterPage() {
  const session = await resolveSessionForApp();
  if (!session) redirect("/login");

  const [accounts, roles, permissions, matrixSets] = await Promise.all([
    listAuthorityAccounts(),
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
        <div className="space-y-8">
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/settings" />}
              className="-ml-2"
            >
              ← Settings
            </Button>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-primary/80 uppercase">
              SODA VISUALS · Authority Center
            </p>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Operational Authority
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Manage existing accounts, Access Levels, and permissions. Create
              login accounts from each crew member&apos;s workspace — not here.
            </p>
          </div>

          <Card className="soda-cc-card border-primary/20">
            <CardHeader>
              <CardTitle>Create login accounts in Crew</CardTitle>
              <CardDescription>
                Open a crew member in{" "}
                <Link href="/people" className="text-soda-pink hover:underline">
                  Crew Workspace
                </Link>
                , then use <strong>Account → Create login account</strong>.
                One account per crew member; credentials shown once.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="soda-cc-card lg:col-span-2">
              <CardHeader>
                <CardTitle>Role templates</CardTitle>
                <CardDescription>
                  Starting points — customize permissions below. DB remains
                  Source of Truth.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid max-h-80 gap-2 overflow-y-auto text-sm sm:grid-cols-2">
                  {ROLE_TEMPLATES.map((t) => (
                    <li
                      key={t.id}
                      className="rounded-lg border border-border/40 px-3 py-2"
                    >
                      <p className="font-medium">{t.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="soda-cc-card">
            <CardHeader>
              <CardTitle>Accounts</CardTitle>
              <CardDescription>
                Disable, enable, reset password, change Access Level, view login
                status and last activity. Job title / role is work identity only.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccountDirectory accounts={accounts} />
            </CardContent>
          </Card>

          <Card className="soda-cc-card">
            <CardHeader>
              <CardTitle>Customize Permissions</CardTitle>
              <CardDescription>
                Action-based permissions by group (Orders, Finance, Crew, …).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RolePermissionsMatrix
                roles={roles}
                permissions={permissions}
                matrix={matrix}
              />
            </CardContent>
          </Card>
        </div>
      </RoleGate>
    </AppShell>
  );
}
