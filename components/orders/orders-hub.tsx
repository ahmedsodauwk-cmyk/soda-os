import Link from "next/link";
import { Building2, Heart } from "lucide-react";

import { OrderEntryActions } from "@/components/orders/order-entry-actions";
import { OrdersContent } from "@/components/orders/orders-content";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HUMAN_LAYER } from "@/lib/brand";

const lanes = [
  {
    href: "/orders/commercial",
    title: "Commercial",
    layer: HUMAN_LAYER.commercial,
    icon: Building2,
  },
  {
    href: "/orders/weddings",
    title: "Wedding",
    layer: HUMAN_LAYER.weddings,
    icon: Heart,
  },
] as const;

export function OrdersHub() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Choose a segment or manage all orders below.
        </p>
        <OrderEntryActions />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {lanes.map((lane) => {
          const Icon = lane.icon;
          return (
            <Link key={lane.href} href={lane.href} className="group block">
              <Card className="soda-cc-card h-full transition-colors group-hover:border-soda-pink/35">
                <CardHeader>
                  <div className="soda-kpi-icon-pink mb-2 flex size-10 items-center justify-center rounded-xl">
                    <Icon className="size-4" />
                  </div>
                  <CardTitle>{lane.title}</CardTitle>
                  <CardDescription
                    className="font-ar text-[0.9375rem] leading-[1.8] text-muted-foreground"
                    dir="rtl"
                  >
                    {lane.layer}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-base font-semibold">All orders</h2>
        <OrdersContent />
      </section>
    </div>
  );
}
