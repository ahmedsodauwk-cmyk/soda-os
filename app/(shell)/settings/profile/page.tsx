import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { ProfileSettingsCard } from "@/components/settings/profile-settings-card";
import { SettingsHubNav } from "@/components/settings/settings-hub-nav";
import { can } from "@/lib/identity/permissions";
import { resolveSessionForApp } from "@/lib/identity/session";
import { getPersonById } from "@/lib/people/repository";

export const dynamic = "force-dynamic";

export default async function SettingsProfilePage() {
  const session = await resolveSessionForApp();
  if (!session) redirect("/login");

  const linkedPerson = session.profile.personId
    ? getPersonById(session.profile.personId)
    : undefined;
  const showSystem = can(session.profile.accessLevel, "settings.users");

  return (
    <AppShell titleKey="settings.myProfile" layer="settings" session={session}>
      <div className="space-y-4">
        <SettingsHubNav showSystem={showSystem} />
        <ProfileSettingsCard
          userId={session.userId}
          displayName={
            session.profile.displayName ||
            linkedPerson?.displayName ||
            session.profile.fullName
          }
          avatarInitials={session.profile.avatarInitials}
          avatarUrl={linkedPerson?.avatarUrl}
          jobTitle={linkedPerson?.jobTitle}
          personId={linkedPerson?.id}
          fallbackName={
            session.profile.displayName || session.profile.fullName
          }
        />
      </div>
    </AppShell>
  );
}
