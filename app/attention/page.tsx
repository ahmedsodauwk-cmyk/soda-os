import Link from "next/link";
import { redirect } from "next/navigation";

import AttentionCenter from "@/components/dashboard/attention-center";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { loadDashboardSnapshot } from "@/lib/dashboard";
import { resolveSessionForApp } from "@/lib/identity/session";

export const dynamic = "force-dynamic";

export default async function AttentionPage() {
  const session = await resolveSessionForApp();
  if (!session) redirect("/login");

  const dashboard = await loadDashboardSnapshot();

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
            Orders needing action, pending collections, confirmations, and
            deadlines.
          </p>
        </div>
        <AttentionCenter items={dashboard.attention} limit={500} showViewAll={false} />
      </div>
    </AppShell>
  );
}
