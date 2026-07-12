import { redirect } from "next/navigation";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { InviteUserForm } from "@/components/auth/invite-user-form";
import { RelatedRecords } from "@/components/navigation/related-records";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { can } from "@/lib/identity/permissions";
import { ROLE_LABELS } from "@/lib/identity/roles";
import { resolveSessionForApp } from "@/lib/identity/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await resolveSessionForApp();
  if (!session) redirect("/login");

  return (
    <AppShell title="الإعدادات" subtitle="الحساب وكلمة السر وصلاحيات الفريق">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="soda-cc-card">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Signed-in workspace identity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Name · </span>
              {session.profile.fullName}
            </p>
            <p>
              <span className="text-muted-foreground">Email · </span>
              {session.profile.email}
            </p>
            <p>
              <span className="text-muted-foreground">Role · </span>
              {ROLE_LABELS[session.profile.role]}
            </p>
            <Link
              href="/settings/password"
              className="inline-block text-soda-pink hover:underline"
            >
              Change password
            </Link>
          </CardContent>
        </Card>

        {can(session.profile.role, "settings.users") ? (
          <Card className="soda-cc-card">
            <CardHeader>
              <CardTitle>Invite user</CardTitle>
              <CardDescription>
                Email invite when Auth Email is enabled; otherwise a temporary
                password is created.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InviteUserForm />
            </CardContent>
          </Card>
        ) : null}

        <RelatedRecords
          items={[
            { label: "Notifications", href: "/notifications" },
            { label: "Finance", href: "/finance" },
            { label: "Crew", href: "/crew" },
            { label: "About SODA VISUALS", href: "/about" },
          ]}
        />
      </div>
    </AppShell>
  );
}
