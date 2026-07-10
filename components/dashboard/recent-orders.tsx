import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DASHBOARD_SECTION_COPY,
  getEmptyState,
} from "@/lib/brand/soda-voice";
import type { RecentOrderRow } from "@/lib/dashboard/types";
import { statusStyles } from "@/lib/orders/status-styles";
import { formatDate, formatPrice, getInitials } from "@/lib/orders/utils";
import { cn } from "@/lib/utils";

interface RecentOrdersProps {
  orders: RecentOrderRow[];
}

export default function RecentOrders({ orders }: RecentOrdersProps) {
  const empty = getEmptyState("orders");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{DASHBOARD_SECTION_COPY.recentOrders.title}</CardTitle>
        <CardDescription
          className="text-xs leading-relaxed text-muted-foreground/80"
          dir="rtl"
        >
          {DASHBOARD_SECTION_COPY.recentOrders.description}
        </CardDescription>
        <CardAction>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            nativeButton={false}
            render={<Link href="/orders" />}
          >
            View all
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-2">
        {orders.length === 0 ? (
          <div className="py-6 text-center" dir="rtl">
            <p className="text-sm font-medium">{empty.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {empty.description}
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar size="sm">
                  <AvatarFallback className="text-xs">
                    {getInitials(order.clientName)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {order.clientName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {order.projectType} · {formatDate(order.shootDate)} ·{" "}
                    {formatPrice(order.price)}
                  </p>
                </div>
              </div>

              <Badge
                variant="outline"
                className={cn("shrink-0", statusStyles[order.status])}
              >
                {order.status}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
