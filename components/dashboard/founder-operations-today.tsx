import Link from "next/link";
import { ArrowLeft, Camera, Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toEasternDigits } from "@/lib/brand/soda-voice";
import type { DashboardSnapshot, RecentOrderRow } from "@/lib/dashboard/types";
import { statusStyles } from "@/lib/orders/status-styles";
import { cn } from "@/lib/utils";

type OpsRow = {
  id: string;
  time: string;
  title: string;
  status: string;
  crewNote: string;
  nextStep: string;
  href: string;
  kind: "shoot" | "delivery" | "order";
};

function buildOpsRows(dashboard: DashboardSnapshot): OpsRow[] {
  const rows: OpsRow[] = [];

  for (const shoot of dashboard.schedule.todayShoots) {
    rows.push({
      id: `shoot-${shoot.id}`,
      time: shoot.date?.slice(11, 16) || "—",
      title: shoot.title,
      status: String(shoot.status),
      crewNote: shoot.location ? `📍 ${shoot.location}` : "الطاقم — راجع الأوردر",
      nextStep: "تصوير النهاردة",
      href: shoot.href || `/orders/${shoot.orderId}`,
      kind: "shoot",
    });
  }

  for (const d of dashboard.schedule.deliveries.filter((x) => x.when === "today")) {
    rows.push({
      id: `del-${d.id}`,
      time: "—",
      title: d.title,
      status: String(d.status),
      crewNote: d.clientName,
      nextStep: "تسليم النهاردة",
      href: d.href || `/orders/${d.orderId}`,
      kind: "delivery",
    });
  }

  for (const order of dashboard.recentOrders.slice(0, 4)) {
    if (rows.length >= 6) break;
    if (rows.some((r) => r.id === `order-${order.id}`)) continue;
    rows.push(orderRowFromRecent(order));
  }

  return rows.slice(0, 5);
}

function orderRowFromRecent(order: RecentOrderRow): OpsRow {
  const nextByStatus: Partial<Record<RecentOrderRow["status"], string>> = {
    Pending: "تأكيد التفاصيل",
    Holding: "متابعة العميل",
    Shooting: "تصوير",
    Editing: "مونتاج",
    Completed: "تسليم",
    Delivered: "مغلق",
    Cancelled: "ملغي",
  };

  return {
    id: `order-${order.id}`,
    time: order.shootDate || "—",
    title: order.clientName,
    status: order.status,
    crewNote: order.projectType,
    nextStep: nextByStatus[order.status] ?? "متابعة",
    href: `/orders/${order.id}`,
    kind: "order",
  };
}

interface FounderOperationsTodayProps {
  dashboard: DashboardSnapshot;
}

/** Operations Today — priority movements with time, status, crew hint, next step. */
export function FounderOperationsToday({ dashboard }: FounderOperationsTodayProps) {
  const rows = buildOpsRows(dashboard);
  const n = toEasternDigits;

  return (
    <Card className="soda-founder-panel soda-cc-card h-full">
      <CardHeader className="flex-row items-start justify-between space-y-0 px-3 py-2.5 pb-1.5">
        <div>
          <CardTitle className="font-ar text-sm font-semibold" dir="rtl">
            شغل النهاردة
          </CardTitle>
          <CardDescription className="font-ar text-[11px]" dir="rtl">
            أهم الأوردرات والحركات — وقت، حالة، والخطوة الجاية
          </CardDescription>
        </div>
        <Link
          href="/orders"
          className="font-ar inline-flex items-center gap-1 text-[11px] text-soda-pink hover:underline"
          dir="rtl"
        >
          عرض الكل
          <ArrowLeft className="size-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-1 px-3 pb-2.5 pt-0">
        {rows.length === 0 ? (
          <p className="font-ar py-3 text-center text-xs text-muted-foreground" dir="rtl">
            مفيش حركة ظاهرة النهاردة — الستوديو هادي.
          </p>
        ) : (
          <ul className="divide-y divide-border/40">
            {rows.map((row) => {
              const KindIcon = row.kind === "delivery" ? Package : Camera;
              return (
                <li key={row.id}>
                  <Link
                    href={row.href}
                    className="flex items-start gap-2 rounded-md px-1 py-1.5 transition-colors hover:bg-muted/40"
                  >
                    <KindIcon className="mt-0.5 size-3.5 shrink-0 text-soda-pink/80" />
                    <div className="min-w-0 flex-1" dir="rtl">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-ar truncate text-xs font-medium">
                          {row.title}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "h-4 px-1 text-[9px]",
                            statusStyles[row.status as keyof typeof statusStyles] ??
                              "border-border/50 bg-muted/30 text-muted-foreground"
                          )}
                        >
                          {row.status}
                        </Badge>
                      </div>
                      <p className="font-ar text-[10px] text-muted-foreground">
                        {row.crewNote} · {row.nextStep}
                      </p>
                    </div>
                    <span className="font-mono shrink-0 text-[10px] tabular-nums text-muted-foreground">
                      {row.time !== "—" ? n(row.time) : "—"}
                    </span>
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
