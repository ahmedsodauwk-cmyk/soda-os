import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { SettingsHubNav } from "@/components/settings/settings-hub-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ACCESS_LEVEL_LABELS } from "@/lib/identity/access-levels";
import { ROLE_LABELS } from "@/lib/identity/roles";
import { can } from "@/lib/identity/permissions";
import { permissionsForAccessLevel } from "@/lib/identity/access-levels";
import { permissionsForAsync } from "@/lib/identity/permission-service";
import { resolveSessionForApp } from "@/lib/identity/session";

export const dynamic = "force-dynamic";

export default async function SettingsScopePage() {
  const session = await resolveSessionForApp();
  if (!session) redirect("/login");

  const showSystem = can(session.profile.accessLevel, "settings.users");
  const permResult = await permissionsForAsync(session.profile.accessLevel);
  const granted =
    permResult.permissions.length > 0
      ? permResult.permissions
      : [...permissionsForAccessLevel(session.profile.accessLevel)];

  return (
    <AppShell titleKey="settings.myScope" layer="settings" session={session}>
      <div className="space-y-4">
        <SettingsHubNav showSystem={showSystem} />
        <Card className="soda-cc-card">
          <CardHeader>
            <CardTitle>My Scope</CardTitle>
            <CardDescription>
              Read-only — access level, role, and permissions. Assignments appear on your orders and calendar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground">Access Level</p>
              <p className="font-medium">
                {ACCESS_LEVEL_LABELS[session.profile.accessLevel]}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Job title (display)</p>
              <p className="font-medium">{ROLE_LABELS[session.profile.role]}</p>
            </div>
            <div>
              <p className="mb-2 text-muted-foreground">Permissions</p>
              <ul className="grid gap-1 sm:grid-cols-2">
                {granted.map((p) => (
                  <li
                    key={p}
                    className="rounded-md bg-muted/40 px-2 py-1 font-mono text-xs"
                  >
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">
              No client directory or manager tools here — order assignments define your work scope.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
