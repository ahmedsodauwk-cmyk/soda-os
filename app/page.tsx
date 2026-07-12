import { AppShell } from "@/components/layout/app-shell";
import AttentionCenter from "@/components/dashboard/attention-center";
import CompanyPulse from "@/components/dashboard/company-pulse";
import DashboardHero from "@/components/dashboard/dashboard-hero";
import FinancialOverviewCard from "@/components/dashboard/financial-overview";
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
import { QuotationPipelineCard } from "@/components/quotations/quotation-pipeline-card";
import { getCompanyPulse } from "@/lib/brand";
import { buildActivityFeed } from "@/lib/dashboard/activity-feed";
import { loadDashboardSnapshot } from "@/lib/dashboard";
import { resolveSessionForApp } from "@/lib/identity/session";

export const dynamic = "force-dynamic";

/**
 * Command Center — compact Human Experience home on Business Core data.
 */
export default async function Home() {
  const [dashboard, session] = await Promise.all([
    loadDashboardSnapshot(),
    resolveSessionForApp(),
  ]);
  const liveEvents = buildActivityFeed();
  const pulse = getCompanyPulse(dashboard);
  const operatorName =
    session?.profile.displayName ?? session?.profile.fullName ?? null;
  const voiceInput = {
    kpis: dashboard.kpis,
    attention: dashboard.attention,
    schedule: dashboard.schedule,
  };

  return (
    <AppShell titleKey="pages.home" layer="dashboard" session={session}>
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

          <QuickActions />

          <div className="grid grid-cols-1 gap-3 lg:gap-4 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <SodaLiveFeed events={liveEvents} className="h-full" />
            </div>
            <div className="xl:col-span-3">
              <CompanyPulse insights={pulse} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:gap-4 xl:grid-cols-5">
            <div id="attention" className="scroll-mt-24 xl:col-span-2">
              <AttentionCenter items={dashboard.attention} />
            </div>
            <div className="xl:col-span-3">
              <FinancialOverviewCard
                financial={dashboard.financial}
                monthlyRevenue={dashboard.monthlyRevenue}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:gap-4 xl:grid-cols-2">
            <div id="schedule" className="scroll-mt-24">
              <UpcomingScheduleCard schedule={dashboard.schedule} />
            </div>
            <RecentOrders orders={dashboard.recentOrders} />
          </div>

          <QuotationPipelineCard />
        </div>
      </WelcomeGate>
    </AppShell>
  );
}
