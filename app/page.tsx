import { AppShell } from "@/components/layout/app-shell";
import AttentionCenter from "@/components/dashboard/attention-center";
import CompanyPulse from "@/components/dashboard/company-pulse";
import FinancialOverviewCard from "@/components/dashboard/financial-overview";
import KPIGrid from "@/components/dashboard/kpi-grid";
import QuickActions from "@/components/dashboard/quick-actions";
import RecentOrders from "@/components/dashboard/recent-orders";
import SodaLiveCard from "@/components/dashboard/soda-live";
import TeamPerformance from "@/components/dashboard/team-performance";
import UpcomingScheduleCard from "@/components/dashboard/upcoming-schedule";
import WorkspacePerformance from "@/components/dashboard/workspace-performance";
import { WelcomeGate } from "@/components/dashboard/welcome-gate";
import {
  buildSodaLiveItems,
  getCompanyPulse,
  getModuleSlogan,
} from "@/lib/brand";
import { getDashboardSnapshot } from "@/lib/dashboard";

/**
 * Command Center — Experience v1.0 home.
 * Static operational core + SODA LIVE + Welcome gate.
 */
export default function Home() {
  const dashboard = getDashboardSnapshot();
  const liveItems = buildSodaLiveItems(dashboard);
  const pulse = getCompanyPulse(dashboard);

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
          {/* SODA LIVE + Company Pulse — awareness row */}
          <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <SodaLiveCard items={liveItems} className="h-full" />
            </div>
            <div className="xl:col-span-3">
              <CompanyPulse insights={pulse} />
            </div>
          </div>

          {/* Quick Actions */}
          <QuickActions />

          {/* Today's Operations */}
          <section aria-labelledby="ops-heading" className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2
                  id="ops-heading"
                  className="font-heading text-base font-semibold tracking-tight"
                >
                  Today&apos;s Operations
                </h2>
                <p
                  className="font-ar mt-1 text-[0.9375rem] leading-[1.8] text-muted-foreground"
                  dir="rtl"
                >
                  إيه اللي شغّال النهاردة؟ أرقام الستوديو في نظرة واحدة.
                </p>
              </div>
            </div>
            <KPIGrid kpis={dashboard.kpis} />
          </section>

          {/* Need Your Attention + Finance Snapshot */}
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

          {/* Today's Timeline + Team Status */}
          <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-2">
            <div id="schedule" className="scroll-mt-24">
              <UpcomingScheduleCard schedule={dashboard.schedule} />
            </div>
            <TeamPerformance team={dashboard.team} />
          </div>

          {/* Projects Snapshot */}
          <WorkspacePerformance workspaces={dashboard.workspaces} />

          {/* Orders Snapshot */}
          <RecentOrders orders={dashboard.recentOrders} />
        </div>
      </WelcomeGate>
    </AppShell>
  );
}
