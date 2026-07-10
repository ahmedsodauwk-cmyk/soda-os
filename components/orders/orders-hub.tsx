import Link from "next/link";
import { Building2, Heart } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const lanes = [
  {
    href: "/orders/commercial",
    title: "Commercial",
    description:
      "Commercial client → projects → orders. Companies, invoices, outstanding.",
    icon: Building2,
  },
  {
    href: "/orders/weddings",
    title: "Wedding",
    description:
      "Year → month → orders with counts: this month, upcoming, delivered, delayed.",
    icon: Heart,
  },
] as const;

export function OrdersHub() {
  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-sm text-muted-foreground">
        Choose a lane. Orders are never one flat table.
      </p>
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
                  <CardDescription>{lane.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
