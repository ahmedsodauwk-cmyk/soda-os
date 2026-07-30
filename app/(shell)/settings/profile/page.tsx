import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { SettingsHubNav } from "@/components/settings/settings-hub-nav";
import { ProfilePhotoEditor } from "@/components/settings/profile-photo-editor";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
        <Card className="soda-cc-card">
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
            <CardDescription>
              Personal identity — photo, display name. Job title is Founder-managed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {linkedPerson ? (
              <ProfilePhotoEditor
                displayName={
                  session.profile.displayName ||
                  linkedPerson.displayName ||
                  session.profile.fullName
                }
                avatarInitials={session.profile.avatarInitials}
                avatarUrl={linkedPerson.avatarUrl}
                jobTitle={linkedPerson.jobTitle}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                No crew profile linked. Display name:{" "}
                <span className="font-medium text-foreground">
                  {session.profile.displayName || session.profile.fullName}
                </span>
                . Ask Founder to link your login to a crew record.
              </p>
            )}
            {linkedPerson ? (
              <p className="mt-4 text-xs text-muted-foreground">
                Full crew workspace (Founder view):{" "}
                <Link
                  href={`/people/${linkedPerson.id}`}
                  className="text-soda-pink hover:underline"
                >
                  /people/{linkedPerson.id}
                </Link>
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
