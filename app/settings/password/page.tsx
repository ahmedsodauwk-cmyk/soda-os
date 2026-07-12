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

export default async function ChangePasswordPage() {
  const session = await resolveSessionForApp();
  if (!session) redirect("/login");

  return (
    <AppShell titleKey="pages.changePassword" layer="settings">
      <BackLink href="/settings" label="Settings" />
      <Card className="soda-cc-card max-w-lg">
        <CardHeader>
          <CardTitle>New password</CardTitle>
          <CardDescription>
            Use at least 8 characters. You stay signed in after updating.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </AppShell>
  );
}
