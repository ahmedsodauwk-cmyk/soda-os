/**
 * Founder Home body — streamed under Suspense (Mission 06.0 Phase 06).
 * Three-column shell: sidebar | main workspace | SODA Brain rail (desktop).
 * Main: greeting, actions, 4×2 folder grid, decision + updates panels.
 */

import { FounderCommandHeader } from "@/components/dashboard/founder-command-header";
import { FounderCompanyUpdates } from "@/components/dashboard/founder-company-updates";
import { FounderFolderGrid } from "@/components/dashboard/founder-folder-grid";
import { FounderHomeActions } from "@/components/dashboard/founder-home-actions";
import { FounderNeedsDecision } from "@/components/dashboard/founder-needs-decision";
import { WelcomeGate } from "@/components/dashboard/welcome-gate";
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

  return (
    <WelcomeGate dashboard={voiceInput}>
      <div className="soda-founder-home flex min-h-0 min-w-0 flex-col gap-3">
        <section
          aria-label="Command overview"
          className="soda-founder-screen-1 soda-stagger-children"
        >
          <div className="soda-founder-command-top">
            <FounderCommandHeader
              dashboard={voiceInput}
              operatorName={operatorName}
            />
            <FounderHomeActions className="lg:pt-1" />
          </div>

          <FounderFolderGrid
            dashboard={dashboard}
            showFinance={showFinance && level === "founder"}
            unreadNotifications={unreadCount}
          />
        </section>

        <section
          aria-label="Operational panels"
          className="soda-founder-lower-panels soda-stagger-children grid min-h-0 gap-3 lg:grid-cols-2"
        >
          <FounderNeedsDecision items={dashboard.attention} limit={6} />
          <FounderCompanyUpdates limit={5} />
        </section>
      </div>
    </WelcomeGate>
  );
}
