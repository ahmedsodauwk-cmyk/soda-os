import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { InviteUserForm } from "@/components/auth/invite-user-form";
import { CompanyEmailDomainForm } from "@/components/auth/company-email-domain-form";
import { SettingsHubNav } from "@/components/settings/settings-hub-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
        <div className="soda-stagger-children grid gap-4 lg:grid-cols-2">
          <Card className="soda-cc-card">
            <CardHeader>
              <CardTitle>Company email domain</CardTitle>
              <CardDescription>
                Default format: username@{emailDomain}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompanyEmailDomainForm currentDomain={emailDomain} />
            </CardContent>
          </Card>

          <Card className="soda-cc-card">
            <CardHeader>
              <CardTitle>Authority Center</CardTitle>
              <CardDescription>
                Manage accounts, roles, and permissions. Create logins from Crew Workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/settings/authority"
                className="text-sm text-soda-pink hover:underline"
              >
                Open Authority Center →
              </Link>
            </CardContent>
          </Card>

          {session.profile.accessLevel === "founder" ? (
            <Card className="soda-cc-card border-soda-pink/20">
              <CardHeader>
                <CardTitle>Backup Center</CardTitle>
                <CardDescription>Founder-only recoverability</CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href="/settings/backup"
                  className="text-sm text-soda-pink hover:underline"
                >
                  Open Backup Center →
                </Link>
              </CardContent>
            </Card>
          ) : null}

          <Card className="soda-cc-card">
            <CardHeader>
              <CardTitle>Invite user (email)</CardTitle>
              <CardDescription>
                Optional email invite. Prefer Create Login Account in Crew Workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InviteUserForm emailDomain={emailDomain} />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
