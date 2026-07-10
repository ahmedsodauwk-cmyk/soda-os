import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

import KPIGrid from "@/components/dashboard/kpi-grid";
import RecentOrders from "@/components/dashboard/recent-orders";
import TeamStatus from "@/components/dashboard/team-status";
import RevenueChart from "@/components/dashboard/revenue-chart";
import CalendarWidget from "@/components/dashboard/calendar-widget";
import Notifications from "@/components/dashboard/notifications";

export default function Home() {
  return (
    <main className="flex min-h-screen bg-background">
      <Sidebar />

      <section className="flex flex-1 flex-col overflow-y-auto">
        <Header />

        <div className="mx-auto w-full max-w-[1600px] space-y-6 p-6">
          <KPIGrid />

          <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-2">
            <RecentOrders />
            <TeamStatus />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-2">
            <RevenueChart />
            <CalendarWidget />
          </div>

          <Notifications />
        </div>
      </section>
    </main>
  );
}
