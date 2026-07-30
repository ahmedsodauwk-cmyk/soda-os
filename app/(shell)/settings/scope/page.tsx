import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { ScopePanel } from "@/components/settings/scope-panel";
import { SettingsHubNav } from "@/components/settings/settings-hub-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRequestDictionary } from "@/lib/i18n/server";
import { permissionsForAccessLevel } from "@/lib/identity/access-levels";
import { can } from "@/lib/identity/permissions";
import { permissionsForAsync } from "@/lib/identity/permission-service";
import { resolveSessionForApp } from "@/lib/identity/session";

export const dynamic = "force-dynamic";

export default async function SettingsScopePage() {
  const session = await resolveSessionForApp();
  if (!session) redirect("/login");

  const { dict } = await getRequestDictionary();
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
            <CardTitle>{dict.settings.myScope}</CardTitle>
            <CardDescription>{dict.settings.scopeDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <ScopePanel
              accessLevel={session.profile.accessLevel}
              role={session.profile.role}
              permissions={granted}
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
