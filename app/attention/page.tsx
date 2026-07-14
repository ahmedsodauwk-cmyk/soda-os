import Link from "next/link";
import { redirect } from "next/navigation";

import AttentionCenter from "@/components/dashboard/attention-center";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { loadScopedDashboardSnapshot } from "@/lib/dashboard/scoped-snapshot";
import { resolveSessionForApp } from "@/lib/identity/session";

export const dynamic = "force-dynamic";

export default async function AttentionPage() {
  const session = await resolveSessionForApp();
  if (!session) redirect("/login");

  const { dashboard } = await loadScopedDashboardSnapshot(session);

  // Non-Founder: strip finance collection pressure (Mission 04.5).
  const attention =
    session.profile.accessLevel === "founder"
      ? dashboard.attention
      : dashboard.attention.filter(
          (a) =>
            a.category !== "unpaid_client" &&
            a.category !== "waiting_payment"
        );

  return (
    <AppShell titleKey="pages.attention" layer="attention" session={session}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="cursor-pointer"
            nativeButton={false}
            render={<Link href="/" />}
          >
            ← Home Screen
          </Button>
          <p className="text-sm text-muted-foreground">
            Orders needing action in your scope — never company-wide for Team /
            AM.
          </p>
        </div>
        <AttentionCenter items={attention} limit={500} showViewAll={false} />
      </div>
    </AppShell>
  );
}
