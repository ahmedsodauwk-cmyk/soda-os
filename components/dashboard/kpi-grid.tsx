import {
  Camera,
  ClipboardList,
  CircleDollarSign,
  FolderKanban,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

import StatCard from "@/components/dashboard/stat-card";
import type { DashboardKpis } from "@/lib/dashboard/types";
import { formatPrice } from "@/lib/orders/utils";

interface KPIGridProps {
  kpis: DashboardKpis;
}

function compactMoney(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `${Math.round(amount / 1_000)}K`;
  }
  return formatPrice(amount);
}

export default function KPIGrid({ kpis }: KPIGridProps) {
  const mom =
    kpis.revenueMonthChangePct === null
      ? { change: "No prior month cash", trend: "neutral" as const }
      : {
          change: `${kpis.revenueMonthChangePct >= 0 ? "+" : ""}${kpis.revenueMonthChangePct}% vs last month`,
          trend:
            kpis.revenueMonthChangePct > 0
              ? ("up" as const)
              : kpis.revenueMonthChangePct < 0
                ? ("down" as const)
                : ("neutral" as const),
        };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Revenue this month"
        value={compactMoney(kpis.revenueThisMonth)}
        icon={CircleDollarSign}
        change={mom.change}
        trend={mom.trend}
      />
      <StatCard
        title="Revenue last month"
        value={compactMoney(kpis.revenueLastMonth)}
        icon={Wallet}
        change="Cash collected"
        trend="neutral"
      />
      <StatCard
        title="Outstanding payments"
        value={compactMoney(kpis.outstandingPayments)}
        icon={Wallet}
        change="Open client balances"
        trend={kpis.outstandingPayments > 0 ? "down" : "neutral"}
      />
      <StatCard
        title="Active projects"
        value={String(kpis.activeProjects)}
        icon={FolderKanban}
        change="Active + on hold"
        trend="neutral"
      />
      <StatCard
        title="Active orders"
        value={String(kpis.activeOrders)}
        icon={ClipboardList}
        change="In production pipeline"
        trend="neutral"
      />
      <StatCard
        title="Upcoming shoots"
        value={String(kpis.upcomingShoots)}
        icon={Camera}
        change="From today onward"
        trend="up"
      />
      <StatCard
        title="Upcoming deliveries"
        value={String(kpis.upcomingDeliveries)}
        icon={Truck}
        change="Due from today"
        trend="neutral"
      />
      <StatCard
        title="Active clients"
        value={String(kpis.activeClients)}
        icon={Users}
        change="With live work or balance"
        trend="neutral"
      />
    </div>
  );
}
