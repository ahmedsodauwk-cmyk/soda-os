import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { BackLink } from "@/components/navigation/back-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resolveSessionForApp } from "@/lib/identity/session";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ forced?: string }>;
}) {
  const session = await resolveSessionForApp();
  if (!session) redirect("/login");

  const params = searchParams ? await searchParams : {};
  const forced =
    params.forced === "1" || session.profile.mustChangePassword;

  return (
    <AppShell
      titleKey="pages.changePassword"
      layer="settings"
      session={session}
    >
      {!forced ? <BackLink href="/settings" label="Settings" /> : null}
      <Card className="soda-cc-card max-w-lg">
        <CardHeader>
          <CardTitle>
            {forced ? "Set a new password" : "New password"}
          </CardTitle>
          <CardDescription>
            {forced
              ? "Your temporary password must be changed before continuing in SODA VISUALS."
              : "Use at least 8 characters. You stay signed in after updating."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm forced={forced} />
        </CardContent>
      </Card>
    </AppShell>
  );
}
