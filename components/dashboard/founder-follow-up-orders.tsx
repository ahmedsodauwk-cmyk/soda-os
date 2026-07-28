import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";

import { SodaSectionHeader } from "@/components/brand/soda-section-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import type { RecentOrderRow } from "@/lib/dashboard/types";
import { getOrders } from "@/lib/orders/repository";
import { statusStyles } from "@/lib/orders/status-styles";
import { getDashboardAsOf } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

const FOLLOW_UP_STATUSES = new Set(["Holding", "Pending"]);

function buildFollowUpOrders(limit = 4): RecentOrderRow[] {
  const asOf = getDashboardAsOf();
  const monthKey = asOf.slice(0, 7);

  return getOrders()
    .filter(
      (o) =>
        FOLLOW_UP_STATUSES.has(o.status) ||
        (o.status === "Confirmed" && o.shootDate.slice(0, 7) === monthKey)
    )
    .sort((a, b) => {
      const pri = (s: string) =>
        s === "Holding" ? 0 : s === "Pending" ? 1 : 2;
      const d = pri(a.status) - pri(b.status);
      if (d !== 0) return d;
      return a.shootDate.localeCompare(b.shootDate);
    })
    .slice(0, limit)
    .map((o) => ({
      id: o.id,
      clientName: o.clientName,
      projectType: o.projectType,
      status: o.status,
      shootDate: o.shootDate,
      price: o.price,
    }));
}

interface FounderFollowUpOrdersProps {
  limit?: number;
}

/** Follow-up Orders — Holding / Pending / imminent confirmed (2–4 rows). */
export function FounderFollowUpOrders({ limit = 4 }: FounderFollowUpOrdersProps) {
  const rows = buildFollowUpOrders(limit);

  return (
    <Card className="soda-founder-panel soda-cc-card h-full min-w-0">
      <CardHeader className="flex-row items-start justify-between space-y-0 px-3 py-2.5 pb-1.5">
        <SodaSectionHeader
          title="Follow-up Orders"
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
            No follow-ups waiting — pipeline is moving.
          </p>
        ) : (
          <ul className="divide-y divide-border/40">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/orders/${row.id}`}
                  className="flex items-start gap-2 rounded-md px-1 py-1.5 transition-colors hover:bg-muted/40"
                >
                  <Phone
                    className="mt-0.5 size-4 shrink-0 text-soda-pink/80"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-[15px] font-semibold">
                        {row.clientName}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "h-5 px-1.5 text-xs",
                          statusStyles[row.status] ??
                            "border-border/50 bg-muted/30 text-muted-foreground"
                        )}
                      >
                        {row.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {row.projectType}
                      {row.shootDate ? ` · ${row.shootDate}` : ""}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
