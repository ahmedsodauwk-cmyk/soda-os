import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { AccountSecurityPanel } from "@/components/settings/account-security-panel";
import { SettingsHubNav } from "@/components/settings/settings-hub-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRequestDictionary } from "@/lib/i18n/server";
import { can } from "@/lib/identity/permissions";
import { resolveSessionForApp } from "@/lib/identity/session";

export const dynamic = "force-dynamic";

export default async function SettingsAccountPage() {
  const session = await resolveSessionForApp();
  if (!session) redirect("/login");

  const { dict } = await getRequestDictionary();
  const showSystem = can(session.profile.accessLevel, "settings.users");

  return (
    <AppShell
      titleKey="settings.accountSecurity"
      layer="settings"
      session={session}
    >
      <div className="space-y-4">
        <SettingsHubNav showSystem={showSystem} />
        <Card className="soda-cc-card">
          <CardHeader>
            <CardTitle>{dict.settings.accountSecurity}</CardTitle>
            <CardDescription>{dict.settings.accountDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <AccountSecurityPanel
              username={session.profile.username}
              email={session.profile.email}
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
