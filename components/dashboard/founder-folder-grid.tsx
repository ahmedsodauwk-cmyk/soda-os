import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bell,
  Calendar,
  DollarSign,
  FileText,
  MessageCircle,
  ShoppingCart,
  Users,
  UsersRound,
} from "lucide-react";

import type { DashboardSnapshot } from "@/lib/dashboard/types";
import { computeQuotationMetrics } from "@/lib/quotations";
import { formatPrice } from "@/lib/orders/utils";
import { getBusinessToday } from "@/lib/business/types";
import { cn } from "@/lib/utils";

type FolderDef = {
  id: string;
  title: string;
  href: string;
  icon: LucideIcon;
  metricA: string;
  metricB: string;
  latest: string;
};

function buildFolders(
  dashboard: DashboardSnapshot,
  opts: { showFinance: boolean; unreadNotifications: number }
): FolderDef[] {
  const { kpis, schedule, team, financial, recentOrders } = dashboard;
  const quoteMetrics = computeQuotationMetrics(getBusinessToday());
  const todayItems =
    schedule.todayShoots.length +
    schedule.deliveries.filter((d) => d.when === "today").length;
  const upcomingItems =
    schedule.tomorrowShoots.length +
    schedule.deliveries.filter((d) => d.when === "tomorrow").length +
    schedule.deadlines.length;
  const onDuty = team.filter((t) => t.currentWorkload > 0).length;
  const latestOrder = recentOrders[0];

  const folders: FolderDef[] = [
    {
      id: "orders",
      title: "Orders",
      href: "/orders",
      icon: ShoppingCart,
      metricA: `${kpis.activeOrders} active`,
      metricB: `${todayItems} today`,
      latest: latestOrder
        ? `${latestOrder.clientName} · ${latestOrder.status}`
        : "No recent orders",
    },
    {
      id: "clients",
      title: "Clients",
      href: "/clients",
      icon: Users,
      metricA: `${kpis.activeClients} active`,
      metricB: `${kpis.activeProjects} projects`,
      latest:
        latestOrder != null
          ? `Latest: ${latestOrder.clientName}`
          : "No client activity",
    },
    {
      id: "quotations",
      title: "Quotations",
      href: "/quotations",
      icon: FileText,
      metricA: `${quoteMetrics.pendingCount} pending`,
      metricB: `${quoteMetrics.waitingClientCount} awaiting client`,
      latest:
        quoteMetrics.pendingCount > 0
          ? `${quoteMetrics.pendingCount} in pipeline`
          : "Pipeline clear",
    },
    {
      id: "calendar",
      title: "Calendar",
      href: "/calendar",
      icon: Calendar,
      metricA: `${schedule.todayShoots.length} shoots today`,
      metricB: `${upcomingItems} upcoming`,
      latest:
        schedule.todayShoots[0]?.title ??
        schedule.deliveries[0]?.title ??
        "Nothing scheduled today",
    },
    {
      id: "crew",
      title: "Crew",
      href: "/people",
      icon: UsersRound,
      metricA: `${onDuty} on duty`,
      metricB: `${team.length} total`,
      latest:
        team.find((t) => t.currentWorkload > 0)?.name ?? "No crew on assignment",
    },
    {
      id: "finance",
      title: "Finance",
      href: "/finance",
      icon: DollarSign,
      metricA: `${formatPrice(financial.collected)} collected`,
      metricB: `${formatPrice(financial.outstanding)} outstanding`,
      latest:
        financial.outstanding > 0
          ? `${formatPrice(financial.outstanding)} to collect`
          : "Collections up to date",
    },
    {
      id: "connect",
      title: "Team Chat",
      href: "/connect",
      icon: MessageCircle,
      metricA: "Connect",
      metricB: "Team channels",
      latest: "Open Team Chat",
    },
    {
      id: "notifications",
      title: "Notifications",
      href: "/notifications",
      icon: Bell,
      metricA:
        opts.unreadNotifications > 0
          ? `${opts.unreadNotifications} unread`
          : "All read",
      metricB: "Inbox",
      latest:
        opts.unreadNotifications > 0
          ? `${opts.unreadNotifications} need attention`
          : "All caught up",
    },
  ];

  if (!opts.showFinance) {
    return folders.filter((f) => f.id !== "finance");
  }

  return folders;
}

interface FounderFolderGridProps {
  dashboard: DashboardSnapshot;
  showFinance?: boolean;
  unreadNotifications?: number;
}

/** 4×2 folder grid — fully clickable shortcuts with real metrics. */
export function FounderFolderGrid({
  dashboard,
  showFinance = true,
  unreadNotifications = 0,
}: FounderFolderGridProps) {
  const folders = buildFolders(dashboard, {
    showFinance,
    unreadNotifications,
  });

  return (
    <section aria-label="Workspace folders">
      <div
        className="soda-founder-folders grid grid-cols-2 gap-2 lg:grid-cols-4"
        role="list"
      >
        {folders.map((folder) => {
          const Icon = folder.icon;
          return (
            <Link
              key={folder.id}
              href={folder.href}
              role="listitem"
              className={cn(
                "soda-founder-folder soda-founder-folder-glow group relative flex min-h-[6.5rem] min-w-0 flex-col justify-between rounded-xl border border-border/60 bg-card/60 p-3",
                "hover:border-soda-pink/40 hover:bg-soda-pink/[0.05] hover:shadow-[0_0_20px_rgba(210,59,104,0.12)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="soda-kpi-icon-pink flex size-8 shrink-0 items-center justify-center rounded-md">
                    <Icon className="size-4" aria-hidden />
                  </div>
                  <p className="truncate text-[15px] font-semibold text-foreground">
                    {folder.title}
                  </p>
                </div>
                <ArrowRight
                  className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-soda-pink"
                  aria-hidden
                />
              </div>
              <div className="space-y-0.5">
                <p className="truncate text-sm text-muted-foreground">
                  {folder.metricA}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {folder.metricB}
                </p>
                <p className="truncate text-xs font-medium text-foreground/80">
                  {folder.latest}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
