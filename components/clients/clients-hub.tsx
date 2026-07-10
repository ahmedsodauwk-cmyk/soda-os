import Link from "next/link";
import { Building2, Heart } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HUMAN_LAYER } from "@/lib/brand";

const lanes = [
  {
    href: "/clients/weddings",
    title: "Wedding clients",
    layer: HUMAN_LAYER.weddingClients,
    icon: Heart,
  },
  {
    href: "/clients/commercial",
    title: "Commercial clients",
    layer: HUMAN_LAYER.commercialClients,
    icon: Building2,
  },
] as const;

export function ClientsHub() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {lanes.map((lane) => {
        const Icon = lane.icon;
        return (
          <Link key={lane.href} href={lane.href} className="group block">
            <Card className="soda-cc-card h-full group-hover:border-soda-pink/35">
              <CardHeader>
                <div className="soda-kpi-icon mb-2 flex size-10 items-center justify-center rounded-xl">
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
              <CardContent>
                <p className="text-xs text-muted-foreground">Open lane →</p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
