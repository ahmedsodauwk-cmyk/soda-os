import Link from "next/link";
import {
  AlertCircle,
  ClipboardList,
  FileText,
  Wallet,
} from "lucide-react";

import { toEasternDigits } from "@/lib/brand/soda-voice";
import type { DashboardSnapshot } from "@/lib/dashboard/types";
import { computeQuotationMetrics } from "@/lib/quotations";
import { getBusinessToday } from "@/lib/business/types";
import { cn } from "@/lib/utils";

type SnapshotMetric = {
  id: string;
  label: string;
  whisper: string;
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
      label: "أوردرات النهاردة",
      whisper: "شوتات وتسليمات اليوم",
      value: todayOrders,
      href: "/schedule/today",
      icon: ClipboardList,
    },
    {
      id: "needs-input",
      label: "محتاج قرارك",
      whisper: "موافقات ومتابعات",
      value: needsInput,
      href: "/attention",
      icon: AlertCircle,
    },
    {
      id: "collections",
      label: "تحصيلات معلّقة",
      whisper: "متأخرة أو مستنية",
      value: collections,
      href: "/finance",
      icon: Wallet,
    },
    {
      id: "quotations",
      label: "عروض أسعار",
      whisper: "في البايبلاين",
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
  const n = toEasternDigits;
  const metrics = buildMetrics(dashboard);

  return (
    <div
      className="soda-founder-snapshot grid grid-cols-2 gap-2 lg:grid-cols-4"
      role="list"
      aria-label="لمحة يومية"
    >
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <Link
            key={m.id}
            href={m.href}
            role="listitem"
            className={cn(
              "soda-founder-metric group flex items-center gap-2.5 rounded-lg border border-border/60 bg-card/60 px-3 py-2 transition-colors",
              "hover:border-soda-pink/35 hover:bg-soda-pink/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <div className="soda-kpi-icon-pink flex size-7 shrink-0 items-center justify-center rounded-md">
              <Icon className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1" dir="rtl">
              <p className="font-ar truncate text-[11px] text-muted-foreground">
                {m.label}
              </p>
              <p className="font-mono text-lg font-semibold tabular-nums leading-none">
                {n(m.value)}
              </p>
              <p className="font-ar hidden truncate text-[10px] text-muted-foreground/80 sm:block">
                {m.whisper}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
