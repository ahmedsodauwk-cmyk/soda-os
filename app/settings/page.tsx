import { redirect } from "next/navigation";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { InviteUserForm } from "@/components/auth/invite-user-form";
import { CompanyEmailDomainForm } from "@/components/auth/company-email-domain-form";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
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
import { getCompanyEmailDomain } from "@/lib/auth/company-email";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await resolveSessionForApp();
  if (!session) redirect("/login");

  const emailDomain = await getCompanyEmailDomain();
  const canManageUsers = can(session.profile.role, "settings.users");

  return (
    <AppShell titleKey="pages.settings" layer="settings" session={session}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="soda-cc-card">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Signed-in SODA VISUALS identity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Name · </span>
              {session.profile.displayName || session.profile.fullName}
            </p>
            <p>
              <span className="text-muted-foreground">Username · </span>
              {session.profile.username ?? "—"}
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

        <Card className="soda-cc-card">
          <CardHeader>
            <CardTitle>Language</CardTitle>
            <CardDescription>
              English 🇺🇸 · العربية 🇪🇬 — preference is saved on this device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LanguageSwitcher variant="inline" />
          </CardContent>
        </Card>

        <Card className="soda-cc-card">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription dir="rtl" className="font-ar">
              فاتح · داكن · حسب النظام — ألوان صودا: أبيض، بنفسجي عميق، وردي.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeSwitcher />
          </CardContent>
        </Card>

        {canManageUsers ? (
          <Card className="soda-cc-card">
            <CardHeader>
              <CardTitle>Company email domain</CardTitle>
              <CardDescription>
                Default format: username@{emailDomain}. Change anytime from
                Settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompanyEmailDomainForm currentDomain={emailDomain} />
            </CardContent>
          </Card>
        ) : null}

        {canManageUsers ? (
          <Card className="soda-cc-card">
            <CardHeader>
              <CardTitle>Invite user</CardTitle>
              <CardDescription>
                Founder-only. Invite only people from the official crew list.
                Temporary passwords force a change on first login.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InviteUserForm emailDomain={emailDomain} />
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
