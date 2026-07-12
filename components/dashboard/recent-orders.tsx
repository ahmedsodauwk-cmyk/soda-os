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
    <Card className="soda-cc-card">
      <CardHeader>
        <CardTitle>{DASHBOARD_SECTION_COPY.recentOrders.title}</CardTitle>
        <CardDescription
          className="font-ar text-[0.9375rem] leading-[1.8] text-muted-foreground"
          dir="rtl"
        >
          {DASHBOARD_SECTION_COPY.recentOrders.description}
        </CardDescription>
        <CardAction>
          <Button
            variant="ghost"
            size="sm"
            className="text-soda-pink hover:text-soda-pink"
            nativeButton={false}
            render={<Link href="/orders" />}
          >
            View all
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-2">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/soda-mark.svg"
              alt=""
              width={28}
              height={28}
              className="opacity-35"
            />
            <div dir="rtl">
              <p className="font-ar text-sm font-medium">{empty.title}</p>
              <p className="font-ar mt-1 text-xs leading-relaxed text-muted-foreground">
                {empty.description}
              </p>
            </div>
          </div>
        ) : (
          orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
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
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
