/**
 * Founder Home body — streamed under Suspense (Mission 06.0 / Home V3).
 * Three-column shell: sidebar | main workspace | SODA Brain rail (desktop).
 * Main: greeting + clock, KPIs, operational panels, management row, lower row.
 */

import { DeferredFinancialOverview } from "@/components/dashboard/deferred-financial-overview";
import CompanyPulse from "@/components/dashboard/company-pulse";
import { FounderCommandHeader } from "@/components/dashboard/founder-command-header";
import { FounderCompanyUpdates } from "@/components/dashboard/founder-company-updates";
import { FounderFollowUpOrders } from "@/components/dashboard/founder-follow-up-orders";
import { FounderKpiRow } from "@/components/dashboard/founder-kpi-row";
import { FounderLiveClock } from "@/components/dashboard/founder-live-clock";
import { FounderNeedsDecision } from "@/components/dashboard/founder-needs-decision";
import { FounderQuickActionsPanel } from "@/components/dashboard/founder-quick-actions-panel";
import { FounderRecentActivity } from "@/components/dashboard/founder-recent-activity";
import SodaLiveFeed from "@/components/dashboard/soda-live";
import { WelcomeGate } from "@/components/dashboard/welcome-gate";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { SodaSectionHeader } from "@/components/brand/soda-section-header";
import { buildActivityFeed } from "@/lib/dashboard/activity-feed";
import { loadDashboardSnapshot } from "@/lib/dashboard";
import { getDashboardAsOf } from "@/lib/dashboard/types";
import { getCompanyPulse } from "@/lib/brand/soda-voice";
import { getOrders } from "@/lib/orders/repository";
import { getPeople } from "@/lib/people/repository";
import { setHasAny, type Permission } from "@/lib/identity/permissions";
import type { AccessLevel } from "@/lib/identity/access-levels";

type Props = {
  operatorName: string | null;
  allowed: readonly Permission[] | undefined;
  level: AccessLevel | null;
};

function countOrdersThisMonth(asOf: string): number {
  const monthKey = asOf.slice(0, 7);
  return getOrders().filter((o) => o.shootDate.slice(0, 7) === monthKey).length;
}

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

  const asOf = getDashboardAsOf();
  const ordersThisMonth = countOrdersThisMonth(asOf);
  const teamMembers = getPeople().length;
  const liveEvents = buildActivityFeed({ includePayments: true });
  const pulseInsights = getCompanyPulse(dashboard);

  return (
    <WelcomeGate dashboard={voiceInput}>
      <div className="soda-founder-home flex min-h-0 min-w-0 flex-col gap-3">
        <section
          aria-label="Command overview"
          className="soda-founder-screen-1 soda-stagger-children"
        >
          <div className="soda-founder-hero-row">
            <FounderCommandHeader
              dashboard={voiceInput}
              operatorName={operatorName}
            />
            <FounderLiveClock className="shrink-0 self-start" />
          </div>

          <FounderKpiRow
            kpis={dashboard.kpis}
            ordersThisMonth={ordersThisMonth}
            teamMembers={teamMembers}
          />
        </section>

        <section
          aria-label="Operational panels"
          className="soda-founder-ops-row soda-stagger-children grid min-h-0 gap-3 lg:grid-cols-3"
        >
          <FounderFollowUpOrders limit={4} />
          <SodaLiveFeed events={liveEvents} />
          <CompanyPulse insights={pulseInsights} />
        </section>

        <section
          aria-label="Management panels"
          className="soda-founder-mgmt-row soda-stagger-children grid min-h-0 gap-3 lg:grid-cols-3"
        >
          <FounderNeedsDecision items={dashboard.attention} limit={6} />
          {showFinance && level === "founder" ? (
            <DeferredFinancialOverview
              financial={dashboard.financial}
              monthlyRevenue={dashboard.monthlyRevenue}
            />
          ) : (
            <Card className="soda-founder-panel soda-cc-card h-full min-w-0">
              <CardHeader className="px-3 py-2.5 pb-1.5">
                <SodaSectionHeader
                  title="Financial Summary"
                  layer="financialPulse"
                  as="h2"
                  size="card"
                />
              </CardHeader>
              <CardContent className="flex h-full min-h-[12rem] items-center justify-center px-3 pb-2.5 pt-0">
                <p className="text-center text-sm text-muted-foreground">
                  Financial summary not available for your permissions.
                </p>
              </CardContent>
            </Card>
          )}
          <FounderQuickActionsPanel />
        </section>

        <section
          aria-label="Recent activity"
          className="soda-founder-lower-panels soda-stagger-children grid min-h-0 gap-3 lg:grid-cols-2"
        >
          <FounderRecentActivity orders={dashboard.recentOrders} limit={5} />
          <FounderCompanyUpdates limit={5} />
        </section>
      </div>
    </WelcomeGate>
  );
}
