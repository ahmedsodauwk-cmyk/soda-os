import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { SystemSettingsCards } from "@/components/settings/system-settings-cards";
import { SettingsHubNav } from "@/components/settings/settings-hub-nav";
import { can } from "@/lib/identity/permissions";
import { getCompanyEmailDomain } from "@/lib/auth/company-email";
import { resolveSessionForApp } from "@/lib/identity/session";

export const dynamic = "force-dynamic";

export default async function SettingsSystemPage() {
  const session = await resolveSessionForApp();
  if (!session) redirect("/login");

  if (!can(session.profile.accessLevel, "settings.users")) {
    redirect("/settings/profile");
  }

  const emailDomain = await getCompanyEmailDomain();

  return (
    <AppShell
      titleKey="settings.systemSettings"
      layer="settings"
      session={session}
    >
      <div className="space-y-4">
        <SettingsHubNav showSystem />
        <SystemSettingsCards
          emailDomain={emailDomain}
          isFounder={session.profile.accessLevel === "founder"}
        />
      </div>
    </AppShell>
  );
}
