import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { BackupCenterClient } from "@/components/backup/backup-center-client";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { canAccessBackupCenter } from "@/lib/backup/access";
import { getBackupDashboardStatus } from "@/lib/backup/status";
import { readBackupIndex } from "@/lib/backup/store";
import { homePathForAccessLevel } from "@/lib/identity/nav";
import { permissionsForAccessLevel } from "@/lib/identity/access-levels";
import { resolveSessionForApp } from "@/lib/identity/session";

export const dynamic = "force-dynamic";

/**
 * SODA Backup Center — Founder only (Mission 08.0).
 */
export default async function BackupCenterPage() {
  const session = await resolveSessionForApp();
  if (!session) redirect("/login");

  if (!canAccessBackupCenter(session.profile.accessLevel)) {
    redirect(
      homePathForAccessLevel(
        session.profile.accessLevel,
        permissionsForAccessLevel(session.profile.accessLevel)
      )
    );
  }

  const [status, history] = await Promise.all([
    getBackupDashboardStatus(),
    Promise.resolve(readBackupIndex()),
  ]);

  return (
    <AppShell titleKey="pages.settings" layer="settings" session={session}>
      <div className="space-y-8">
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/settings" />}
            className="-ml-2"
          >
            ← Settings
          </Button>
          <div className="flex items-start gap-4">
            <Image
              src="/brand/soda-icon.png"
              alt="SODA VISUALS"
              width={44}
              height={44}
              className="mt-0.5 rounded-lg"
            />
            <div className="space-y-1">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-soda-pink/90 uppercase">
                SODA VISUALS · Founder
              </p>
              <h1 className="font-heading text-2xl font-semibold tracking-tight">
                Backup Center
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Recoverability for SODA OS. Manual packages today; automatic,
                scheduled, and cloud destinations later — never secrets.
              </p>
            </div>
          </div>
        </div>

        <BackupCenterClient status={status} history={history} />
      </div>
    </AppShell>
  );
}
