/**
 * Founder Home body — streamed under Suspense (Mission 06.0 Phase 06).
 * Reference-locked layout: 3-column main grid + compact status row + action strip.
 */

import { FounderActionStrip } from "@/components/dashboard/founder-action-strip";
import { FounderBottomPulse } from "@/components/dashboard/founder-bottom-pulse";
import { FounderCalendarToday } from "@/components/dashboard/founder-calendar-today";
import { FounderCommandHeader } from "@/components/dashboard/founder-command-header";
import { FounderCompactStatusRow } from "@/components/dashboard/founder-compact-status-row";
import { FounderDailySnapshot } from "@/components/dashboard/founder-daily-snapshot";
import { FounderNeedsDecision } from "@/components/dashboard/founder-needs-decision";
import { FounderRecentActivity } from "@/components/dashboard/founder-recent-activity";
import { FounderStudioActivity } from "@/components/dashboard/founder-studio-activity";
import { WelcomeGate } from "@/components/dashboard/welcome-gate";
import { getBackupDashboardStatus } from "@/lib/backup/status";
import { loadNotificationsForSession } from "@/lib/core/notifications/load";
import { loadDashboardSnapshot } from "@/lib/dashboard";
import { resolveSessionForApp } from "@/lib/identity/session";
import { setHasAny, type Permission } from "@/lib/identity/permissions";
import type { AccessLevel } from "@/lib/identity/access-levels";

type Props = {
  operatorName: string | null;
  allowed: readonly Permission[] | undefined;
  level: AccessLevel | null;
};

export async function FounderHomeStream({
  operatorName,
  allowed,
  level,
}: Props) {
  const session = await resolveSessionForApp();
  const dashboard = await loadDashboardSnapshot();
  const voiceInput = {
    kpis: dashboard.kpis,
    attention: dashboard.attention,
    schedule: dashboard.schedule,
  };

  const showFinance =
    !!allowed &&
    setHasAny(allowed, ["finance.view", "dashboard.finance"] as Permission[]);

  const notifications = session
    ? await loadNotificationsForSession(session)
    : [];
  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  const backupStatus =
    level === "founder" ? await getBackupDashboardStatus() : null;

  return (
    <WelcomeGate dashboard={voiceInput}>
      <div className="soda-founder-home flex min-h-0 min-w-0 flex-col gap-3">
        {/* Screenful 1 — header, KPIs, 3-col grid, status row, actions */}
        <section
          aria-label="Command overview"
          className="soda-founder-screen-1 soda-stagger-children"
        >
          <FounderCommandHeader
            dashboard={voiceInput}
            operatorName={operatorName}
          />

          <FounderDailySnapshot dashboard={dashboard} />

          <div className="soda-founder-main grid min-h-0 grid-cols-1 gap-2 lg:grid-cols-3">
            <FounderNeedsDecision items={dashboard.attention} />
            <FounderRecentActivity orders={dashboard.recentOrders} />
            <FounderCalendarToday dashboard={dashboard} />
          </div>

          <FounderCompactStatusRow
            team={dashboard.team}
            attention={dashboard.attention}
            unreadNotifications={unreadCount}
            storageStatus={backupStatus?.storageStatus ?? null}
            showStorage={level === "founder"}
          />

          <FounderActionStrip />
        </section>

        {/* Screenful 2 — financial pulse, pipeline, team, activity (no duplicate order list) */}
        <section
          aria-label="Studio pulse"
          className="soda-founder-screen-2 soda-stagger-children"
        >
          <FounderBottomPulse
            dashboard={dashboard}
            showFinance={showFinance && level === "founder"}
          />
          <FounderStudioActivity
            team={dashboard.team}
            attention={dashboard.attention}
          />
        </section>
      </div>
    </WelcomeGate>
  );
}
