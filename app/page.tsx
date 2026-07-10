import { AppShell } from "@/components/layout/app-shell";
import AttentionCenter from "@/components/dashboard/attention-center";
import FinancialOverviewCard from "@/components/dashboard/financial-overview";
import KPIGrid from "@/components/dashboard/kpi-grid";
import QuickActions from "@/components/dashboard/quick-actions";
import RecentOrders from "@/components/dashboard/recent-orders";
import TeamPerformance from "@/components/dashboard/team-performance";
import UpcomingScheduleCard from "@/components/dashboard/upcoming-schedule";
import WorkspacePerformance from "@/components/dashboard/workspace-performance";
import { getDashboardSnapshot } from "@/lib/dashboard";
import { formatDate } from "@/lib/orders/utils";

export default function Home() {
  const dashboard = getDashboardSnapshot();

  return (
    <AppShell
      title="Executive Dashboard"
      subtitle={`Company health · as of ${formatDate(dashboard.asOf)}`}
    >
      <div className="space-y-6">
        <QuickActions />

        <KPIGrid kpis={dashboard.kpis} />

        <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <FinancialOverviewCard
              financial={dashboard.financial}
              monthlyRevenue={dashboard.monthlyRevenue}
            />
          </div>
          <div className="xl:col-span-2">
            <AttentionCenter items={dashboard.attention} />
          </div>
        </div>

        <WorkspacePerformance workspaces={dashboard.workspaces} />

        <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-2">
          <TeamPerformance team={dashboard.team} />
          <UpcomingScheduleCard schedule={dashboard.schedule} />
        </div>

        <RecentOrders orders={dashboard.recentOrders} />
      </div>
    </AppShell>
  );
}
