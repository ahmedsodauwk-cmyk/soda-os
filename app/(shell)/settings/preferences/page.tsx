import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { PreferencesCards } from "@/components/settings/preferences-cards";
import { SettingsHubNav } from "@/components/settings/settings-hub-nav";
import { can } from "@/lib/identity/permissions";
import { resolveSessionForApp } from "@/lib/identity/session";

export const dynamic = "force-dynamic";

export default async function SettingsPreferencesPage() {
  const session = await resolveSessionForApp();
  if (!session) redirect("/login");

  const showSystem = can(session.profile.accessLevel, "settings.users");

  return (
    <AppShell
      titleKey="settings.myPreferences"
      layer="settings"
      session={session}
    >
      <div className="space-y-4">
        <SettingsHubNav showSystem={showSystem} />
        <PreferencesCards />
      </div>
    </AppShell>
  );
}
