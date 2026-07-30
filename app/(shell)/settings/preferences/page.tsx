import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { SettingsHubNav } from "@/components/settings/settings-hub-nav";
import { ReducedMotionSwitcher } from "@/components/preferences/reduced-motion-switcher";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
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
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="soda-cc-card">
            <CardHeader>
              <CardTitle>Language</CardTitle>
              <CardDescription>English · العربية — saved on this device</CardDescription>
            </CardHeader>
            <CardContent>
              <LanguageSwitcher variant="inline" />
            </CardContent>
          </Card>

          <Card className="soda-cc-card">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Light · Dark · System</CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSwitcher />
            </CardContent>
          </Card>

          <Card className="soda-cc-card">
            <CardHeader>
              <CardTitle>Motion</CardTitle>
              <CardDescription>
                Override system reduced-motion preference for SODA OS animations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReducedMotionSwitcher />
            </CardContent>
          </Card>

          <Card className="soda-cc-card">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                In-app notification center — per-type prefs coming later
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/notifications"
                className="text-sm text-soda-pink hover:underline"
              >
                Open Notifications →
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
