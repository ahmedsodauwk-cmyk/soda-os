import Link from "next/link";
import { ArrowRight, Camera, Package } from "lucide-react";

import { SodaSectionHeader } from "@/components/brand/soda-section-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import type { DashboardSnapshot, RecentOrderRow } from "@/lib/dashboard/types";
import { statusStyles } from "@/lib/orders/status-styles";
import { cn } from "@/lib/utils";

type OpsRow = {
  id: string;
  time: string;
  title: string;
  status: string;
  crewNote: string;
  nextStep: string;
  href: string;
  kind: "shoot" | "delivery" | "order";
};

const NEXT_STEP_EN: Partial<Record<RecentOrderRow["status"], string>> = {
  Pending: "Confirm details",
  Holding: "Client follow-up",
  Shooting: "Shooting",
  Editing: "Editing",
  Completed: "Delivery",
  Delivered: "Closed",
  Cancelled: "Cancelled",
};

function buildOpsRows(dashboard: DashboardSnapshot, limit = 4): OpsRow[] {
  const rows: OpsRow[] = [];

  for (const shoot of dashboard.schedule.todayShoots) {
    rows.push({
      id: `shoot-${shoot.id}`,
      time: shoot.date?.slice(11, 16) || "—",
      title: shoot.title,
      status: String(shoot.status),
      crewNote: shoot.location ? shoot.location : "Crew — see order",
      nextStep: "Shoot today",
      href: shoot.href || `/orders/${shoot.orderId}`,
      kind: "shoot",
    });
  }

  for (const d of dashboard.schedule.deliveries.filter((x) => x.when === "today")) {
    rows.push({
      id: `del-${d.id}`,
      time: "—",
      title: d.title,
      status: String(d.status),
      crewNote: d.clientName,
      nextStep: "Delivery today",
      href: d.href || `/orders/${d.orderId}`,
      kind: "delivery",
    });
  }

  for (const order of dashboard.recentOrders) {
    if (rows.length >= limit + 2) break;
    if (rows.some((r) => r.id === `order-${order.id}`)) continue;
    rows.push(orderRowFromRecent(order));
  }

  return rows.slice(0, limit);
}

function orderRowFromRecent(order: RecentOrderRow): OpsRow {
  return {
    id: `order-${order.id}`,
    time: order.shootDate || "—",
    title: order.clientName,
    status: order.status,
    crewNote: order.projectType,
    nextStep: NEXT_STEP_EN[order.status] ?? "Follow up",
    href: `/orders/${order.id}`,
    kind: "order",
  };
}

interface FounderOperationsTodayProps {
  dashboard: DashboardSnapshot;
  limit?: number;
}

/** Today's Operations — priority movements with time, status, crew hint, next step. */
export function FounderOperationsToday({
  dashboard,
  limit = 4,
}: FounderOperationsTodayProps) {
  const allRows = buildOpsRows(dashboard, limit);
  const rows = allRows.slice(0, limit);
  const totalToday =
    dashboard.schedule.todayShoots.length +
    dashboard.schedule.deliveries.filter((d) => d.when === "today").length +
    dashboard.recentOrders.length;
  const remaining = Math.max(0, totalToday - rows.length);

  return (
    <Card className="soda-founder-panel soda-cc-card h-full min-w-0">
      <CardHeader className="flex-row items-start justify-between space-y-0 px-3 py-2.5 pb-1.5">
        <SodaSectionHeader
          title="Today's Operations"
          layer="todayOperations"
          as="h2"
          size="card"
        />
        <Link
          href="/orders"
          className="inline-flex items-center gap-1 text-sm font-semibold text-soda-pink hover:underline"
        >
          View All
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </CardHeader>
      <CardContent className="space-y-1 px-3 pb-2.5 pt-0">
        {rows.length === 0 ? (
          <p className="py-3 text-center text-[15px] text-muted-foreground">
            No visible movement today — studio is quiet.
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
                            statusStyles[row.status as keyof typeof statusStyles] ??
                              "border-border/50 bg-muted/30 text-muted-foreground"
                          )}
                        >
                          {row.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {row.crewNote} · {row.nextStep}
                      </p>
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
        {remaining > 0 ? (
          <Link
            href="/orders"
            className="block pt-1 text-center text-sm font-semibold text-soda-pink hover:underline"
          >
            View All (+{remaining})
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
