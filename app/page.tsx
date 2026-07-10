import { AppShell } from "@/components/layout/app-shell";
import AttentionCenter from "@/components/dashboard/attention-center";
import CompanyPulse from "@/components/dashboard/company-pulse";
import FinancialOverviewCard from "@/components/dashboard/financial-overview";
import KPIGrid from "@/components/dashboard/kpi-grid";
import PeopleOwedCard from "@/components/dashboard/people-owed";
import QuickActions from "@/components/dashboard/quick-actions";
import RecentOrders from "@/components/dashboard/recent-orders";
import SodaLiveCard from "@/components/dashboard/soda-live";
import TeamPerformance from "@/components/dashboard/team-performance";
import UpcomingScheduleCard from "@/components/dashboard/upcoming-schedule";
import WeddingMonthCard from "@/components/dashboard/wedding-month-card";
import WorkspacePerformance from "@/components/dashboard/workspace-performance";
import { WelcomeGate } from "@/components/dashboard/welcome-gate";
import {
  buildSodaLiveItems,
  getCompanyPulse,
  getModuleSlogan,
} from "@/lib/brand";
import { getDashboardSnapshot } from "@/lib/dashboard";

/**
 * Command Center — real business questions only.
 */
export default function Home() {
  const dashboard = getDashboardSnapshot();
  const liveItems = buildSodaLiveItems(dashboard);
  const pulse = getCompanyPulse(dashboard);
  const showAwareness = liveItems.length > 0 || pulse.length > 0;

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
          {showAwareness ? (
            <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-5">
              {liveItems.length > 0 ? (
                <div className="xl:col-span-2">
                  <SodaLiveCard items={liveItems} className="h-full" />
                </div>
              ) : null}
              {pulse.length > 0 ? (
                <div
                  className={
                    liveItems.length > 0 ? "xl:col-span-3" : "xl:col-span-5"
                  }
                >
                  <CompanyPulse insights={pulse} />
                </div>
              ) : null}
            </div>
          ) : null}

          <QuickActions />

          <section aria-labelledby="ops-heading" className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2
                  id="ops-heading"
                  className="font-heading text-base font-semibold tracking-tight"
                >
                  Today&apos;s Operations
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  What today? Revenue, outstanding, shoots, and active work.
                </p>
              </div>
            </div>
            <KPIGrid kpis={dashboard.kpis} />
          </section>

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
            <WeddingMonthCard />
            <PeopleOwedCard />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-2">
            <div id="schedule" className="scroll-mt-24">
              <UpcomingScheduleCard schedule={dashboard.schedule} />
            </div>
            <TeamPerformance team={dashboard.team} />
          </div>

          <WorkspacePerformance workspaces={dashboard.workspaces} />

          <RecentOrders orders={dashboard.recentOrders} />
        </div>
      </WelcomeGate>
    </AppShell>
  );
}
