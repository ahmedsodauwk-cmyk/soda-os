import Link from "next/link";
import {
  AlertCircle,
  ClipboardList,
  FileText,
  Wallet,
} from "lucide-react";

import { SodaLanguage } from "@/components/brand/soda-language";
import type { DashboardSnapshot } from "@/lib/dashboard/types";
import { computeQuotationMetrics } from "@/lib/quotations";
import { getBusinessToday } from "@/lib/business/types";
import { cn } from "@/lib/utils";

type SnapshotMetric = {
  id: string;
  label: string;
  guidanceLayer: "todayOrdersSnapshot" | "needsDecisionSnapshot" | "pendingCollections" | "pendingQuotationsSnapshot";
  value: number;
  href: string;
  icon: typeof ClipboardList;
};

function buildMetrics(dashboard: DashboardSnapshot): SnapshotMetric[] {
  const todayOrders =
    dashboard.schedule.todayShoots.length +
    dashboard.schedule.deliveries.filter((d) => d.when === "today").length;

  const needsInput = dashboard.attention.filter(
    (a) =>
      a.severity === "critical" ||
      a.severity === "warning" ||
      a.category === "deadline_soon"
  ).length;

  const collections = dashboard.attention.filter(
    (a) =>
      a.category === "unpaid_client" || a.category === "waiting_payment"
  ).length;

  const quoteMetrics = computeQuotationMetrics(getBusinessToday());
  const pendingQuotes = quoteMetrics.pendingCount;

  return [
    {
      id: "today-orders",
      label: "Today's Orders",
      guidanceLayer: "todayOrdersSnapshot",
      value: todayOrders,
      href: "/schedule/today",
      icon: ClipboardList,
    },
    {
      id: "needs-input",
      label: "Needs Your Decision",
      guidanceLayer: "needsDecisionSnapshot",
      value: needsInput,
      href: "/attention",
      icon: AlertCircle,
    },
    {
      id: "collections",
      label: "Pending Collections",
      guidanceLayer: "pendingCollections",
      value: collections,
      href: "/finance",
      icon: Wallet,
    },
    {
      id: "quotations",
      label: "Pending Quotations",
      guidanceLayer: "pendingQuotationsSnapshot",
      value: pendingQuotes,
      href: "/quotations",
      icon: FileText,
    },
  ];
}

interface FounderDailySnapshotProps {
  dashboard: DashboardSnapshot;
}

/** Top row — four compact clickable KPIs from live dashboard data. */
export function FounderDailySnapshot({ dashboard }: FounderDailySnapshotProps) {
  const metrics = buildMetrics(dashboard);

  return (
    <section aria-label="Daily snapshot">
      <SodaLanguage layer="todaySnapshot" size="compact" className="mb-1.5 hidden sm:block" />
      <div
        className="soda-founder-snapshot soda-stagger-children grid grid-cols-2 gap-2 lg:grid-cols-4"
        role="list"
      >
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.id}
              href={m.href}
              role="listitem"
              className={cn(
                "soda-founder-metric group flex min-w-0 items-center gap-2.5 rounded-lg border border-border/60 bg-card/60 px-3 py-2.5 transition-colors",
                "hover:border-soda-pink/35 hover:bg-soda-pink/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <div className="soda-kpi-icon-pink flex size-8 shrink-0 items-center justify-center rounded-md">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {m.label}
                </p>
                <p className="font-mono text-xl font-bold tabular-nums leading-none">
                  {m.value}
                </p>
                <SodaLanguage
                  layer={m.guidanceLayer}
                  size="compact"
                  className="hidden truncate sm:block"
                />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
