import Link from "next/link";
import { Package, Camera } from "lucide-react";

import { SodaSectionHeader } from "@/components/brand/soda-section-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import type { DashboardSnapshot } from "@/lib/dashboard/types";
import { statusStyles } from "@/lib/orders/status-styles";
import { cn } from "@/lib/utils";

interface FounderCalendarTodayProps {
  dashboard: DashboardSnapshot;
  limit?: number;
}

/** Calendar / Today — shoots, deliveries, and deadlines from live schedule. */
export function FounderCalendarToday({
  dashboard,
  limit = 4,
}: FounderCalendarTodayProps) {
  const todayDeliveries = dashboard.schedule.deliveries.filter(
    (d) => d.when === "today"
  );
  const rows = [
    ...dashboard.schedule.todayShoots.map((s) => ({
      id: `shoot-${s.id}`,
      time: s.date?.slice(11, 16) || "—",
      title: s.title,
      status: String(s.status),
      href: s.href || `/orders/${s.orderId}`,
      kind: "shoot" as const,
    })),
    ...todayDeliveries.map((d) => ({
      id: `del-${d.id}`,
      time: "—",
      title: d.title,
      status: String(d.status),
      href: d.href || `/orders/${d.orderId}`,
      kind: "delivery" as const,
    })),
  ].slice(0, limit);

  const totalToday =
    dashboard.schedule.todayShoots.length + todayDeliveries.length;

  return (
    <Card className="soda-founder-panel soda-cc-card h-full min-w-0">
      <CardHeader className="flex-row items-start justify-between space-y-0 px-3 py-2.5 pb-1.5">
        <SodaSectionHeader
          title="Calendar / Today"
          layer="schedule"
          as="h2"
          size="card"
        />
        <Link
          href="/calendar"
          className="inline-flex items-center gap-1 text-sm font-semibold text-soda-pink hover:underline"
        >
          Open
        </Link>
      </CardHeader>
      <CardContent className="space-y-1 px-3 pb-2.5 pt-0">
        {rows.length === 0 ? (
          <p className="py-3 text-center text-[15px] text-muted-foreground">
            No shoots or deliveries scheduled for today.
          </p>
        ) : (
          <ul className="divide-y divide-border/40">
            {rows.map((row) => {
              const KindIcon = row.kind === "delivery" ? Package : Camera;
              return (
                <li key={row.id}>
                  <Link
                    href={row.href}
                    className="flex items-start gap-2 rounded-md px-1 py-1.5 transition-colors hover:bg-muted/40"
                  >
                    <KindIcon
                      className="mt-0.5 size-4 shrink-0 text-soda-pink/80"
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-[15px] font-semibold">
                          {row.title}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "h-5 px-1.5 text-xs",
                            statusStyles[
                              row.status as keyof typeof statusStyles
                            ] ??
                              "border-border/50 bg-muted/30 text-muted-foreground"
                          )}
                        >
                          {row.status}
                        </Badge>
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-sm tabular-nums text-muted-foreground">
                      {row.time}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {totalToday > rows.length ? (
          <Link
            href="/calendar"
            className="block pt-1 text-center text-sm font-semibold text-soda-pink hover:underline"
          >
            View All (+{totalToday - rows.length})
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
