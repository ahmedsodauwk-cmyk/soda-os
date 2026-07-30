import Link from "next/link";
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
import { can } from "@/lib/identity/permissions";
import { resolveSessionForApp } from "@/lib/identity/session";

export const dynamic = "force-dynamic";

export default async function SettingsAccountPage() {
  const session = await resolveSessionForApp();
  if (!session) redirect("/login");

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
            <CardTitle>Account &amp; Security</CardTitle>
            <CardDescription>
              Auth-owned credentials. Email and phone changes go through Supabase Auth (Founder Authority Center for provisioning).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="text-muted-foreground">Username · </span>
              {session.profile.username ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Email · </span>
              {session.profile.email}
            </p>
            <p className="text-xs text-muted-foreground">
              Email is managed by Auth — not editable here. Contact Founder for account email changes.
            </p>
            <Link
              href="/settings/password"
              className="inline-block text-soda-pink hover:underline"
            >
              Change password
            </Link>
            <p className="text-xs text-muted-foreground">
              Two-factor authentication — coming soon (placeholder only).
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
