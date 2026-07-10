import { AppShell } from "@/components/layout/app-shell";
import AttentionCenter from "@/components/dashboard/attention-center";
import CompanyPulse from "@/components/dashboard/company-pulse";
import DashboardHero from "@/components/dashboard/dashboard-hero";
import FinancialOverviewCard from "@/components/dashboard/financial-overview";
import PeopleOwedCard from "@/components/dashboard/people-owed";
import QuickActions from "@/components/dashboard/quick-actions";
import RecentOrders from "@/components/dashboard/recent-orders";
import RotatingSummary from "@/components/dashboard/rotating-summary";
import SodaLiveFeed from "@/components/dashboard/soda-live";
import TeamPerformance from "@/components/dashboard/team-performance";
import UpcomingScheduleCard from "@/components/dashboard/upcoming-schedule";
import { WelcomeGate } from "@/components/dashboard/welcome-gate";
import { QuotationPipelineCard } from "@/components/quotations/quotation-pipeline-card";
import { getCompanyPulse, getModuleSlogan } from "@/lib/brand";
import { buildActivityFeed } from "@/lib/dashboard/activity-feed";
import { getDashboardSnapshot } from "@/lib/dashboard";
import { buildRotatingSummaries } from "@/lib/dashboard/rotating-summaries";

/**
 * Command Center — living operational surface from real studio data.
 */
export default function Home() {
  const dashboard = getDashboardSnapshot();
  const liveEvents = buildActivityFeed();
  const pulse = getCompanyPulse(dashboard);
  const rotatingPanels = buildRotatingSummaries(dashboard);

  return (
    <AppShell
      title="Command Center"
      subtitle={getModuleSlogan("dashboard")}
    >
      <WelcomeGate
        dashboard={{
          kpis: dashboard.kpis,
          attention: dashboard.attention,
          schedule: dashboard.schedule,
        }}
      >
        <div className="soda-page-enter space-y-6 sm:space-y-8">
          <DashboardHero
            dashboard={{
              kpis: dashboard.kpis,
              attention: dashboard.attention,
              schedule: dashboard.schedule,
            }}
          />

          <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <SodaLiveFeed events={liveEvents} className="h-full" />
            </div>
            <div className="xl:col-span-3">
              <CompanyPulse insights={pulse} />
            </div>
          </div>

          <QuickActions />

          <QuotationPipelineCard />

          {rotatingPanels.length > 0 ? (
            <RotatingSummary panels={rotatingPanels} />
          ) : null}

          <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-5">
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

          <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-2">
            <div id="schedule" className="scroll-mt-24">
              <UpcomingScheduleCard schedule={dashboard.schedule} />
            </div>
            <TeamPerformance team={dashboard.team} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-2">
            <PeopleOwedCard />
            <RecentOrders orders={dashboard.recentOrders} />
          </div>
        </div>
      </WelcomeGate>
    </AppShell>
  );
}
