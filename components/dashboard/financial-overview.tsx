"use client";

import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  FinancialOverview,
  MonthlyRevenuePoint,
} from "@/lib/dashboard/types";
import { DASHBOARD_SECTION_COPY } from "@/lib/brand";
import { dashboardHref } from "@/lib/identity/navigation";
import { formatPrice } from "@/lib/orders/utils";
import { cn } from "@/lib/utils";

/** Concise Arabic — one line per metric (Financial Summary cards only). */
const METRIC_ARABIC: Record<
  "Revenue" | "Outstanding" | "Deposits" | "Remaining",
  string
> = {
  Revenue: "التحصيل الفعلي",
  Outstanding: "مستحقات معلقة",
  Deposits: "العربونات المحصّلة",
  Remaining: "الباقي على الحساب",
};

interface FinancialOverviewCardProps {
  financial: FinancialOverview;
  monthlyRevenue: MonthlyRevenuePoint[];
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-mono font-medium">{formatPrice(payload[0].value)}</p>
    </div>
  );
}

type MetricLabel = keyof typeof METRIC_ARABIC;

function Metric({
  label,
  value,
  href,
  highlight,
}: {
  label: MetricLabel;
  value: string;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "soda-financial-metric flex min-h-[5.25rem] min-w-0 flex-col justify-between gap-1.5 rounded-lg border px-2.5 py-2 transition-colors sm:px-3 sm:py-2.5",
        "border-primary/15 bg-primary/[0.05] hover:border-soda-pink/40 hover:bg-soda-pink/[0.07]",
        highlight && "border-soda-pink/25 bg-soda-pink/[0.06]"
      )}
    >
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs font-semibold leading-tight text-foreground">
          {label}
        </p>
        <p
          className="font-ar text-[10px] leading-snug text-muted-foreground sm:text-[11px]"
          dir="rtl"
          lang="ar"
        >
          {METRIC_ARABIC[label]}
        </p>
      </div>
      <p
        className="soda-financial-metric-amount min-w-0 font-mono font-bold leading-none tracking-tight tabular-nums whitespace-nowrap"
        dir="ltr"
        style={{ unicodeBidi: "isolate" }}
      >
        {value}
      </p>
    </Link>
  );
}

export default function FinancialOverviewCard({
  financial,
  monthlyRevenue,
}: FinancialOverviewCardProps) {
  const chartData = monthlyRevenue.map((m) => ({
    month: m.label,
    revenue: m.revenue,
  }));

  return (
    <Card className="soda-cc-card soda-financial-summary h-full min-w-0">
      <CardHeader>
        <CardTitle>
          <Link
            href={dashboardHref("revenue")}
            className="hover:text-soda-pink"
          >
            {DASHBOARD_SECTION_COPY.financial.title}
          </Link>
        </CardTitle>
        <CardDescription
          className="font-ar text-[0.9375rem] leading-[1.8] text-muted-foreground"
          dir="rtl"
        >
          {DASHBOARD_SECTION_COPY.financial.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4">
        <div className="@container/metrics min-w-0">
          <div className="soda-financial-metrics-grid grid min-w-0 auto-rows-fr grid-cols-2 gap-2 max-[15rem]:grid-cols-1 @[52rem]/metrics:grid-cols-4">
            <Metric
              label="Revenue"
              value={formatPrice(financial.revenue)}
              href={dashboardHref("revenue")}
              highlight
            />
            <Metric
              label="Outstanding"
              value={formatPrice(financial.outstanding)}
              href={dashboardHref("outstanding")}
            />
            <Metric
              label="Deposits"
              value={formatPrice(financial.deposits)}
              href={dashboardHref("deposits")}
            />
            <Metric
              label="Remaining"
              value={formatPrice(financial.remainingBalance)}
              href={dashboardHref("remaining")}
            />
          </div>
        </div>

        <Link href={dashboardHref("revenue")} className="block h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="dashRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="55%"
                    stopColor="var(--chart-2)"
                    stopOpacity={0.12}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={48}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickFormatter={(value: number) =>
                  value >= 1000 ? `${Math.round(value / 1000)}K` : String(value)
                }
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="url(#dashRevenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Link>

        <p className="text-xs text-muted-foreground">
          Revenue = collected cash
          {financial.booked != null ? (
            <>
              {" "}
              · booked (agreed){" "}
              <span className="font-mono text-foreground">
                {formatPrice(financial.booked)}
              </span>
            </>
          ) : null}{" "}
          · chart shows cash by month
        </p>
      </CardContent>
    </Card>
  );
}
