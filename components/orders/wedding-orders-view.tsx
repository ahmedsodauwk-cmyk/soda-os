import Link from "next/link";

import { WeddingMonthGroups } from "@/components/business/wedding-month-groups";
import { OrderEntryActions } from "@/components/orders/order-entry-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildWeddingOrdersOverview,
  weddingBrowserYears,
} from "@/lib/business/wedding-orders";
import { getOrders } from "@/lib/orders/repository";
import { cn } from "@/lib/utils";

function egp(n: number) {
  return `${n.toLocaleString("en-EG")} EGP`;
}

interface WeddingOrdersViewProps {
  selectedYear?: number;
}

export function WeddingOrdersView({ selectedYear }: WeddingOrdersViewProps) {
  const orders = getOrders();
  const years = weddingBrowserYears(orders);
  const year =
    selectedYear && years.includes(selectedYear)
      ? selectedYear
      : years.find((y) => y === new Date().getFullYear()) ??
        years[0] ??
        new Date().getFullYear();
  const overview = buildWeddingOrdersOverview(orders, undefined, year);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/orders" />}
          className="-ml-2 cursor-pointer"
        >
          ← Orders hub
        </Button>
        <OrderEntryActions defaultProjectType="Wedding" />
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

      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-muted-foreground">Year</p>
        {years.map((y) => (
          <Button
            key={y}
            size="sm"
            variant={y === year ? "default" : "outline"}
            nativeButton={false}
            render={<Link href={`/orders/weddings?year=${y}`} />}
            className={cn(
              "cursor-pointer",
              y === year && "bg-soda-pink hover:bg-soda-pink/90"
            )}
          >
            {y}
          </Button>
        ))}
      </div>

      <WeddingMonthGroups groups={overview.yearMonths} showEmpty />
    </div>
  );
}
