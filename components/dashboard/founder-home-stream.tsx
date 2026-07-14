/**
 * Founder Home body — streamed under Suspense (Mission 06.0 Phase 06).
 * Slow dashboard snapshot never blocks shell + greeting paint.
 */

import AttentionCenter from "@/components/dashboard/attention-center";
import CompanyPulse from "@/components/dashboard/company-pulse";
import DashboardHero from "@/components/dashboard/dashboard-hero";
import {
  HumanMessage,
  SmartTip,
} from "@/components/dashboard/human-home";
import QuickActions from "@/components/dashboard/quick-actions";
import RecentOrders from "@/components/dashboard/recent-orders";
import SodaLiveFeed from "@/components/dashboard/soda-live";
import TodayFocus from "@/components/dashboard/today-focus";
import UpcomingScheduleCard from "@/components/dashboard/upcoming-schedule";
import { WelcomeGate } from "@/components/dashboard/welcome-gate";
import { DeferredFinancialOverview } from "@/components/dashboard/deferred-financial-overview";
import { QuotationPipelineCard } from "@/components/quotations/quotation-pipeline-card";
import { getCompanyPulse } from "@/lib/brand";
import { buildActivityFeed } from "@/lib/dashboard/activity-feed";
import { loadDashboardSnapshot } from "@/lib/dashboard";
import { recentOrdersCopy } from "@/lib/identity/data-scope";
import { maySeeCompanyPulse } from "@/lib/identity/module-access";
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
  const liveEvents = buildActivityFeed();
  const pulse = getCompanyPulse(dashboard);
  const voiceInput = {
    kpis: dashboard.kpis,
    attention: dashboard.attention,
    schedule: dashboard.schedule,
  };
  const recentCopy = recentOrdersCopy("founder");

  const showFinance =
    !!allowed &&
    setHasAny(allowed, ["finance.view", "dashboard.finance"] as Permission[]);
  const showOrders =
    !!allowed && setHasAny(allowed, ["orders.view"] as Permission[]);
  const showSchedule =
    !!allowed &&
    setHasAny(allowed, ["calendar.view", "orders.view"] as Permission[]);
  const showQuotations =
    !!allowed && setHasAny(allowed, ["quotations.view"] as Permission[]);
  const showCompanyPulse =
    maySeeCompanyPulse(level ?? "founder") &&
    !!allowed &&
    setHasAny(allowed, [
      "dashboard.company",
      "dashboard.team",
    ] as Permission[]);

  return (
    <WelcomeGate dashboard={voiceInput}>
      <div className="soda-page-enter space-y-3 sm:space-y-4">
        <DashboardHero dashboard={voiceInput} operatorName={operatorName} />

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5 lg:gap-4">
          <div className="lg:col-span-3">
            <TodayFocus dashboard={voiceInput} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-1">
            <HumanMessage
              dashboard={voiceInput}
              operatorName={operatorName}
            />
            <SmartTip dashboard={voiceInput} />
          </div>
        </div>

        <QuickActions
          allowedPermissions={allowed}
          accessLevel={level ?? undefined}
        />

        <div className="grid grid-cols-1 gap-3 lg:gap-4 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <SodaLiveFeed events={liveEvents} className="h-full" />
          </div>
          {showCompanyPulse ? (
            <div className="xl:col-span-3">
              <CompanyPulse insights={pulse} />
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 lg:gap-4 xl:grid-cols-5">
          <div id="attention" className="scroll-mt-24 xl:col-span-2">
            <AttentionCenter items={dashboard.attention} />
          </div>
          {showFinance ? (
            <div className="xl:col-span-3">
              <DeferredFinancialOverview
                financial={dashboard.financial}
                monthlyRevenue={dashboard.monthlyRevenue}
              />
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 lg:gap-4 xl:grid-cols-2">
          {showSchedule ? (
            <div id="schedule" className="scroll-mt-24">
              <UpcomingScheduleCard schedule={dashboard.schedule} />
            </div>
          ) : null}
          {showOrders ? (
            <RecentOrders
              orders={dashboard.recentOrders}
              title={recentCopy.title}
              description={recentCopy.description}
            />
          ) : null}
        </div>

        {showQuotations ? <QuotationPipelineCard /> : null}
      </div>
    </WelcomeGate>
  );
}
