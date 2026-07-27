import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";

import { SodaSectionHeader } from "@/components/brand/soda-section-header";
import { SodaEmptyState } from "@/components/ui/soda-empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import type { RecentOrderRow } from "@/lib/dashboard/types";
import { statusStyles } from "@/lib/orders/status-styles";
import { formatPrice } from "@/lib/orders/utils";
import { cn } from "@/lib/utils";

interface FounderRecentActivityProps {
  orders: RecentOrderRow[];
  limit?: number;
}

/** Screenful 2 — recent orders when live data exists. */
export function FounderRecentActivity({
  orders,
  limit = 5,
}: FounderRecentActivityProps) {
  const visible = orders.slice(0, limit);
  const remaining = Math.max(0, orders.length - visible.length);

  if (orders.length === 0) {
    return (
      <Card className="soda-founder-panel soda-cc-card h-full min-w-0">
        <CardHeader className="px-3 py-2.5 pb-1.5">
          <SodaSectionHeader
            title="Recent Orders"
            layer="recentOrders"
            as="h2"
            size="card"
          />
        </CardHeader>
        <CardContent className="px-3 pb-2.5 pt-0">
          <SodaEmptyState
            icon={ClipboardList}
            title="No recent orders"
            layer="recentOrders"
            className="py-6"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="soda-founder-panel soda-cc-card h-full min-w-0">
      <CardHeader className="flex-row items-start justify-between space-y-0 px-3 py-2.5 pb-1.5">
        <SodaSectionHeader
          title="Recent Orders"
          layer="recentOrders"
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
      <CardContent className="px-3 pb-2.5 pt-0">
        <ul className="divide-y divide-border/40">
          {visible.map((order) => (
            <li key={order.id}>
              <Link
                href={`/orders/${order.id}`}
                className="flex items-center gap-2 rounded-md px-1 py-1.5 transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-[15px] font-semibold">
                      {order.clientName}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-5 px-1.5 text-xs",
                        statusStyles[order.status] ??
                          "border-border/50 bg-muted/30 text-muted-foreground"
                      )}
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {order.projectType}
                    {order.shootDate ? ` · ${order.shootDate}` : ""}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-muted-foreground">
                  {formatPrice(order.price)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
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
