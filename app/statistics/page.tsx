import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBusinessToday } from "@/lib/business/types";
import { bootstrapBusinessCore } from "@/lib/core";
import { getOperationsStatistics } from "@/lib/ops/stats";
import { formatPrice } from "@/lib/orders/utils";
import { refreshAllDomainData } from "@/lib/supabase/refresh-all";

export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
  bootstrapBusinessCore();
  await refreshAllDomainData().catch(() => undefined);

  const asOf = getBusinessToday();
  const stats = getOperationsStatistics(asOf);

  return (
    <AppShell titleKey="pages.statistics" layer="statistics">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Monthly revenue" value={formatPrice(stats.monthlyRevenue)} />
          <StatCard label="Yearly revenue" value={formatPrice(stats.yearlyRevenue)} />
          <StatCard label="Collected" value={formatPrice(stats.collected)} />
          <StatCard
            label="Completion rate"
            value={`${Math.round(stats.completionRate * 100)}%`}
            hint={`${stats.completedOrders}/${stats.totalOrders} orders`}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <RankCard title="Top clients" rows={stats.topClients} />
          <RankCard title="Top projects" rows={stats.topProjects} />
          <RankCard title="Top crew" rows={stats.topCrew} valueSuffix=" jobs" />
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <p className="mt-1 font-mono text-xl font-semibold">{value}</p>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function RankCard({
  title,
  rows,
  valueSuffix = "",
}: {
  title: string;
  rows: Array<{ id: string; label: string; detail: string; value: number; href: string }>;
  valueSuffix?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>From Business + Financial Core</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row, i) => (
              <li key={row.id}>
                <Link
                  href={row.href}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border/60 px-3 py-2 hover:border-soda-pink/35"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {i + 1}. {row.label}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {row.detail}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs">
                    {valueSuffix
                      ? `${row.value}${valueSuffix}`
                      : formatPrice(row.value)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
