import Link from "next/link";

import { WeddingMonthGroups } from "@/components/business/wedding-month-groups";
import { OrderEntryActions } from "@/components/orders/order-entry-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildWeddingOrdersOverview } from "@/lib/business/wedding-orders";
import { getOrders } from "@/lib/orders/repository";

function egp(n: number) {
  return `${n.toLocaleString("en-EG")} EGP`;
}

export function WeddingOrdersView() {
  const overview = buildWeddingOrdersOverview(getOrders());

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/orders" />}
          className="-ml-2"
        >
          ← Orders hub
        </Button>
        <OrderEntryActions
          defaultProjectType="Wedding"
          triggerLabel="+ New"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-semibold">
              {overview.thisMonthCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {egp(overview.totalRevenueThisMonth)} booked
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Next month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-semibold">
              {overview.nextMonthCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Delayed
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <p className="font-mono text-2xl font-semibold text-amber-300">
              {overview.delayedCount}
            </p>
            {overview.delayedCount > 0 ? (
              <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-300">
                overdue delivery
              </Badge>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Delivered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-semibold text-emerald-400">
              {overview.deliveredCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <WeddingMonthGroups groups={overview.groups} />
    </div>
  );
}
