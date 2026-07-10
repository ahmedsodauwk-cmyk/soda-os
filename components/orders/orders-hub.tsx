import Link from "next/link";
import { Building2, Heart } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getModuleSlogan } from "@/lib/brand/soda-voice";

const lanes = [
  {
    href: "/orders/weddings",
    title: "Wedding orders",
    description: "Timeline by year and month — counts, delayed, delivered.",
    icon: Heart,
    whisper: "أيام العمر على الجدول.",
  },
  {
    href: "/orders/commercial",
    title: "Commercial orders",
    description: "Company drill-down — projects, deliveries, invoices.",
    icon: Building2,
    whisper: "الحسابات التجارية من الشركة.",
  },
] as const;

export function OrdersHub() {
  return (
    <div className="space-y-6">
      <p className="font-ar max-w-2xl text-[0.9375rem] leading-[1.8] text-muted-foreground" dir="rtl">
        {getModuleSlogan("orders")}
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
                <CardContent>
                  <p className="font-ar text-sm text-muted-foreground" dir="rtl">
                    {lane.whisper}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
