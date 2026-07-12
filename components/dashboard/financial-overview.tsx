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
import { DASHBOARD_SECTION_COPY, HUMAN_LAYER } from "@/lib/brand";
import { dashboardHref } from "@/lib/identity/navigation";
import { formatPrice } from "@/lib/orders/utils";

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

function Metric({
  label,
  value,
  layerHint,
  href,
}: {
  label: string;
  value: string;
  layerHint: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="cursor-pointer rounded-lg border border-primary/15 bg-primary/[0.05] px-3 py-2.5 transition-colors hover:border-soda-pink/40 hover:bg-soda-pink/[0.07] first:border-soda-pink/25 first:bg-soda-pink/[0.06]"
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className="font-ar mt-0.5 text-[11px] leading-[1.7] text-muted-foreground"
        dir="rtl"
      >
        {layerHint}
      </p>
      <p className="mt-0.5 font-mono text-lg font-semibold tracking-tight tabular-nums">
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
    <Card className="soda-cc-card h-full">
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
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Metric
            label="Revenue"
            value={formatPrice(financial.revenue)}
            layerHint={HUMAN_LAYER.revenue}
            href={dashboardHref("revenue")}
          />
          <Metric
            label="Outstanding"
            value={formatPrice(financial.outstanding)}
            layerHint={HUMAN_LAYER.outstanding}
            href={dashboardHref("outstanding")}
          />
          <Metric
            label="Deposits"
            value={formatPrice(financial.deposits)}
            layerHint={HUMAN_LAYER.deposits}
            href={dashboardHref("deposits")}
          />
          <Metric
            label="Remaining"
            value={formatPrice(financial.remainingBalance)}
            layerHint={HUMAN_LAYER.remaining}
            href={dashboardHref("remaining")}
          />
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
