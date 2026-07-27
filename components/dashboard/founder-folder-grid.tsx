import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Calendar,
  DollarSign,
  FileText,
  MessageCircle,
  ShoppingCart,
  UsersRound,
  Users,
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
  facts: string[];
};

function buildFolders(
  dashboard: DashboardSnapshot,
  opts: { showFinance: boolean; unreadNotifications: number }
): FolderDef[] {
  const { kpis, schedule, team, financial } = dashboard;
  const quoteMetrics = computeQuotationMetrics(getBusinessToday());
  const todayItems =
    schedule.todayShoots.length +
    schedule.deliveries.filter((d) => d.when === "today").length;
  const upcomingItems =
    schedule.tomorrowShoots.length +
    schedule.deliveries.filter((d) => d.when === "tomorrow").length +
    schedule.deadlines.length;
  const onDuty = team.filter((t) => t.currentWorkload > 0).length;

  const folders: FolderDef[] = [
    {
      id: "orders",
      title: "Orders",
      href: "/orders",
      icon: ShoppingCart,
      facts: [
        `${kpis.activeOrders} active`,
        `${todayItems} today`,
      ],
    },
    {
      id: "clients",
      title: "Clients",
      href: "/clients",
      icon: Users,
      facts: [`${kpis.activeClients} active clients`],
    },
    {
      id: "quotations",
      title: "Quotations",
      href: "/quotations",
      icon: FileText,
      facts: [
        `${quoteMetrics.pendingCount} pending`,
        `${quoteMetrics.waitingClientCount} awaiting client`,
      ],
    },
    {
      id: "calendar",
      title: "Calendar",
      href: "/calendar",
      icon: Calendar,
      facts: [
        `${schedule.todayShoots.length} shoots today`,
        `${upcomingItems} upcoming`,
      ],
    },
    {
      id: "crew",
      title: "Crew",
      href: "/people",
      icon: UsersRound,
      facts: [
        `${onDuty} on duty`,
        `${team.length} total`,
      ],
    },
    {
      id: "connect",
      title: "Team Chat",
      href: "/connect",
      icon: MessageCircle,
      facts: ["Open Connect"],
    },
    {
      id: "notifications",
      title: "Notifications",
      href: "/notifications",
      icon: Bell,
      facts: [
        opts.unreadNotifications > 0
          ? `${opts.unreadNotifications} unread`
          : "All caught up",
      ],
    },
  ];

  if (opts.showFinance) {
    folders.splice(5, 0, {
      id: "finance",
      title: "Finance",
      href: "/finance",
      icon: DollarSign,
      facts: [
        `${formatPrice(financial.collected)} collected`,
        `${formatPrice(financial.outstanding)} outstanding`,
      ],
    });
  }

  return folders;
}

interface FounderFolderGridProps {
  dashboard: DashboardSnapshot;
  showFinance?: boolean;
  unreadNotifications?: number;
}

/** Fully clickable folder cards — keyboard accessible shortcuts to real routes. */
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
        className="soda-founder-folders grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
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
                "soda-founder-folder group flex min-h-[5.5rem] min-w-0 flex-col gap-1.5 rounded-xl border border-border/60 bg-card/60 p-3 transition-colors",
                "hover:border-soda-pink/35 hover:bg-soda-pink/[0.04]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <div className="flex items-center gap-2">
                <div className="soda-kpi-icon-pink flex size-8 shrink-0 items-center justify-center rounded-md">
                  <Icon className="size-4" aria-hidden />
                </div>
                <p className="truncate text-[15px] font-semibold text-foreground">
                  {folder.title}
                </p>
              </div>
              <ul className="space-y-0.5 text-sm text-muted-foreground">
                {folder.facts.slice(0, 3).map((fact) => (
                  <li key={fact} className="truncate leading-snug">
                    {fact}
                  </li>
                ))}
              </ul>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
