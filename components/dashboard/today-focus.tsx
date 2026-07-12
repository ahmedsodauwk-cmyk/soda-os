import Link from "next/link";
import { AlertTriangle, Camera, Package, Wallet } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toEasternDigits } from "@/lib/brand/soda-voice";
import type { DashboardSnapshot } from "@/lib/dashboard/types";

interface TodayFocusProps {
  dashboard: Pick<DashboardSnapshot, "attention" | "schedule" | "kpis">;
}

type FocusItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
  icon: typeof Camera;
};

/** Today's important work — shoots, deliveries, attention, collections. */
export default function TodayFocus({ dashboard }: TodayFocusProps) {
  const items: FocusItem[] = [];
  const n = toEasternDigits;

  for (const shoot of dashboard.schedule.todayShoots.slice(0, 4)) {
    items.push({
      id: `shoot-${shoot.id}`,
      title: shoot.title,
      detail: `${shoot.clientName} · ${shoot.location || "تصوير النهاردة"}`,
      href: shoot.href || `/orders/${shoot.id}`,
      icon: Camera,
    });
  }

  for (const d of dashboard.schedule.deliveries.filter((x) => x.when === "today").slice(0, 3)) {
    items.push({
      id: `del-${d.id}`,
      title: d.title,
      detail: `${d.clientName} · تسليم النهاردة`,
      href: d.href || `/orders/${d.id}`,
      icon: Package,
    });
  }

  for (const a of dashboard.attention
    .filter((x) => x.severity === "critical" || x.severity === "warning")
    .slice(0, 3)) {
    items.push({
      id: `att-${a.id}`,
      title: a.title,
      detail: a.detail,
      href: a.href ?? "/attention",
      icon: a.category === "unpaid_client" ? Wallet : AlertTriangle,
    });
  }

  const unique = items.filter(
    (item, i, arr) => arr.findIndex((x) => x.id === item.id) === i
  ).slice(0, 6);

  return (
    <Card className="soda-cc-card">
      <CardHeader className="py-3 pb-2">
        <CardTitle className="text-base">تركيز النهاردة</CardTitle>
        <CardDescription className="font-ar text-xs" dir="rtl">
          أهم شغل اليوم — تصوير، تسليم، ومتابعات.
          {dashboard.schedule.todayShoots.length > 0
            ? ` · ${n(dashboard.schedule.todayShoots.length)} شوت`
            : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3 pt-0">
        {unique.length === 0 ? (
          <p className="font-ar text-sm text-muted-foreground" dir="rtl">
            مفيش حاجة ضاغطة النهاردة — الستوديو هادي.
          </p>
        ) : (
          <ul className="space-y-1">
            {unique.slice(0, 4).map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50"
                  >
                    <Icon className="mt-0.5 size-4 shrink-0 text-soda-pink" />
                    <div className="min-w-0" dir="rtl">
                      <p className="font-ar text-sm font-medium leading-snug">
                        {item.title}
                      </p>
                      <p className="font-ar text-xs text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
