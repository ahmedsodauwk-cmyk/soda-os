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
import { KPI_COPY } from "@/lib/brand/soda-voice";
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
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title={KPI_COPY.revenueThisMonth.title}
        value={compactMoney(kpis.revenueThisMonth)}
        icon={CircleDollarSign}
        change={mom.change}
        trend={mom.trend}
        whisper={KPI_COPY.revenueThisMonth.whisper}
      />
      <StatCard
        title={KPI_COPY.revenueLastMonth.title}
        value={compactMoney(kpis.revenueLastMonth)}
        icon={Wallet}
        change="Cash collected"
        trend="neutral"
        whisper={KPI_COPY.revenueLastMonth.whisper}
      />
      <StatCard
        title={KPI_COPY.outstanding.title}
        value={compactMoney(kpis.outstandingPayments)}
        icon={Wallet}
        change="Open client balances"
        trend={kpis.outstandingPayments > 0 ? "down" : "neutral"}
        whisper={KPI_COPY.outstanding.whisper}
      />
      <StatCard
        title={KPI_COPY.activeProjects.title}
        value={String(kpis.activeProjects)}
        icon={FolderKanban}
        change="Active + on hold"
        trend="neutral"
        whisper={KPI_COPY.activeProjects.whisper}
      />
      <StatCard
        title={KPI_COPY.activeOrders.title}
        value={String(kpis.activeOrders)}
        icon={ClipboardList}
        change="In production pipeline"
        trend="neutral"
        whisper={KPI_COPY.activeOrders.whisper}
      />
      <StatCard
        title={KPI_COPY.upcomingShoots.title}
        value={String(kpis.upcomingShoots)}
        icon={Camera}
        change="From today onward"
        trend="up"
        whisper={KPI_COPY.upcomingShoots.whisper}
      />
      <StatCard
        title={KPI_COPY.upcomingDeliveries.title}
        value={String(kpis.upcomingDeliveries)}
        icon={Truck}
        change="Due from today"
        trend="neutral"
        whisper={KPI_COPY.upcomingDeliveries.whisper}
      />
      <StatCard
        title={KPI_COPY.activeClients.title}
        value={String(kpis.activeClients)}
        icon={Users}
        change="With live work or balance"
        trend="neutral"
        whisper={KPI_COPY.activeClients.whisper}
      />
    </div>
  );
}
