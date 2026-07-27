/**
 * Founder Home body — streamed under Suspense (Mission 06.0 Phase 06).
 * Visual redesign: compact Command Center — no-scroll target at 1440×900.
 */

import { FounderBottomPulse } from "@/components/dashboard/founder-bottom-pulse";
import { FounderCommandHeader } from "@/components/dashboard/founder-command-header";
import { FounderDailySnapshot } from "@/components/dashboard/founder-daily-snapshot";
import { FounderNeedsDecision } from "@/components/dashboard/founder-needs-decision";
import { FounderOperationsToday } from "@/components/dashboard/founder-operations-today";
import { WelcomeGate } from "@/components/dashboard/welcome-gate";
import { loadDashboardSnapshot } from "@/lib/dashboard";
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
  const dashboard = await loadDashboardSnapshot();
  const voiceInput = {
    kpis: dashboard.kpis,
    attention: dashboard.attention,
    schedule: dashboard.schedule,
  };

  const showFinance =
    !!allowed &&
    setHasAny(allowed, ["finance.view", "dashboard.finance"] as Permission[]);

  return (
    <WelcomeGate dashboard={voiceInput}>
      <div className="soda-founder-home soda-page-enter flex min-h-0 flex-col gap-2 min-w-0">
        <FounderCommandHeader
          dashboard={voiceInput}
          operatorName={operatorName}
        />

        <FounderDailySnapshot dashboard={dashboard} />

        <div className="soda-founder-main grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-2">
          <FounderOperationsToday dashboard={dashboard} />
          <FounderNeedsDecision items={dashboard.attention} />
        </div>

        <FounderBottomPulse
          dashboard={dashboard}
          showFinance={showFinance && level === "founder"}
        />
      </div>
    </WelcomeGate>
  );
}
