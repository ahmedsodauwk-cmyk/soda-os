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
import { getDictionary, type DictKey } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

const AR_NAV = getDictionary("ar").nav;

type FolderDef = {
  id: string;
  title: string;
  titleAr: string;
  href: string;
  icon: LucideIcon;
  metricA: string;
  metricB: string;
  latest: string;
  sparkline?: "orders" | "clients";
};

function FolderSparkline({ variant }: { variant: "orders" | "clients" }) {
  const stroke =
    variant === "orders"
      ? "rgba(210, 59, 104, 0.85)"
      : "rgba(139, 92, 246, 0.85)";
  const fill =
    variant === "orders"
      ? "rgba(210, 59, 104, 0.12)"
      : "rgba(139, 92, 246, 0.12)";
  const path =
    variant === "orders"
      ? "M2 18 L6 14 L10 16 L14 10 L18 12 L22 6 L30 8"
      : "M2 16 L7 12 L11 14 L15 8 L19 10 L24 5 L30 7";

  return (
    <svg
      viewBox="0 0 32 20"
      className="soda-folder-sparkline h-5 w-12 shrink-0 opacity-90"
      aria-hidden
    >
      <path d={`${path} L30 20 L2 20 Z`} fill={fill} />
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function navArLabel(key: DictKey): string {
  const parts = key.split(".") as [string, string];
  if (parts[0] === "nav" && parts[1] in AR_NAV) {
    return AR_NAV[parts[1] as keyof typeof AR_NAV];
  }
  return "";
}

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
      titleAr: navArLabel("nav.orders"),
      href: "/orders",
      icon: ShoppingCart,
      metricA: `${kpis.activeOrders} active`,
      metricB: `${todayItems} today`,
      latest: latestOrder
        ? `${latestOrder.clientName} · ${latestOrder.status}`
        : "No recent orders",
      sparkline: "orders",
    },
    {
      id: "clients",
      title: "Clients",
      titleAr: navArLabel("nav.clients"),
      href: "/clients",
      icon: Users,
      metricA: `${kpis.activeClients} active`,
      metricB: `${kpis.activeProjects} projects`,
      latest:
        latestOrder != null
          ? `${latestOrder.clientName}`
          : "No client activity",
      sparkline: "clients",
    },
    {
      id: "quotations",
      title: "Quotations",
      titleAr: navArLabel("nav.quotations"),
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
      titleAr: navArLabel("nav.calendar"),
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
      titleAr: navArLabel("nav.people"),
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
      titleAr: navArLabel("nav.finance"),
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
      titleAr: navArLabel("nav.connect"),
      href: "/connect",
      icon: MessageCircle,
      metricA: "Connect",
      metricB: "Team channels",
      latest: "Open Team Chat",
    },
    {
      id: "notifications",
      title: "Notifications",
      titleAr: navArLabel("nav.notifications"),
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
        className="soda-founder-folders grid grid-cols-2 gap-2.5 lg:grid-cols-4"
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
                "soda-founder-folder soda-founder-folder-glow group relative flex min-h-[7.25rem] min-w-0 flex-col justify-between rounded-xl border border-violet-500/20 bg-card/70 p-3",
                "hover:border-soda-pink/45 hover:bg-soda-pink/[0.06]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2">
                  <div className="soda-kpi-icon-pink flex size-8 shrink-0 items-center justify-center rounded-md">
                    <Icon className="size-4" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-foreground">
                      {folder.title}
                    </p>
                    {folder.titleAr ? (
                      <p
                        className="truncate text-xs text-muted-foreground"
                        lang="ar"
                        dir="rtl"
                      >
                        {folder.titleAr}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {folder.sparkline ? (
                    <FolderSparkline variant={folder.sparkline} />
                  ) : null}
                  <ArrowRight
                    className="size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-soda-pink"
                    aria-hidden
                  />
                </div>
              </div>
              <div className="space-y-0.5 border-t border-border/30 pt-2">
                <p className="truncate text-sm text-muted-foreground">
                  {folder.metricA}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {folder.metricB}
                </p>
                <p className="truncate text-xs font-medium text-foreground/85">
                  Latest: {folder.latest}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
