import Link from "next/link";
import { Heart } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buildWeddingOrdersOverview } from "@/lib/business/wedding-orders";
import { getOrders } from "@/lib/orders/repository";

function egp(n: number) {
  return `${n.toLocaleString("en-EG")} EGP`;
}

/** Wedding revenue / pipeline this month from real order data. */
export default function WeddingMonthCard() {
  const overview = buildWeddingOrdersOverview(getOrders());

  return (
    <Card className="soda-cc-card h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="size-4 text-soda-pink" />
          Weddings this month
        </CardTitle>
        <CardDescription>
          Booked shoot revenue and pipeline from wedding orders.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] text-muted-foreground">Orders</p>
            <p className="font-mono text-2xl font-semibold">
              {overview.thisMonthCount}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Booked</p>
            <p className="font-mono text-2xl font-semibold">
              {egp(overview.totalRevenueThisMonth)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Next month</p>
            <p className="font-mono text-lg font-semibold">
              {overview.nextMonthCount}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Delayed</p>
            <p className="font-mono text-lg font-semibold text-amber-300">
              {overview.delayedCount}
            </p>
          </div>
        </div>
        <Link
          href="/orders/weddings"
          className="text-xs font-medium text-soda-pink hover:underline"
        >
          Open wedding timeline →
        </Link>
      </CardContent>
    </Card>
  );
}
