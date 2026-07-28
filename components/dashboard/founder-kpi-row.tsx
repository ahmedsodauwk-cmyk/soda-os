import Link from "next/link";
import {
  ClipboardList,
  DollarSign,
  FolderKanban,
  UsersRound,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { SodaLanguage } from "@/components/brand/soda-language";
import type { DashboardKpis } from "@/lib/dashboard/types";
import { formatPrice } from "@/lib/orders/utils";
import { cn } from "@/lib/utils";

/**
 * KPI row — real data mapping (Founder Home V3):
 * | Card              | Source                                              |
 * |-------------------|-----------------------------------------------------|
 * | Orders this month | `getOrders()` shootDate in current `asOf` month     |
 * | Revenue           | `kpis.revenueThisMonth` — cash collected this month |
 * | Active projects   | `kpis.activeProjects` — active/on-hold projects     |
 * | Pending payments  | `kpis.outstandingPayments` — unpaid order balances    |
 * | Team members      | `getPeople()` — active crew count (status ≠ inactive) |
 */

type KpiDef = {
  id: string;
  label: string;
  guidanceLayer:
    | "todayOrdersSnapshot"
    | "revenueThisMonth"
    | "activeProjects"
    | "pendingCollections"
    | "teamAvailability";
  value: string;
  href: string;
  icon: LucideIcon;
};

function buildKpis(
  kpis: DashboardKpis,
  ordersThisMonth: number,
  teamMembers: number
): KpiDef[] {
  return [
    {
      id: "orders-month",
      label: "Orders this month",
      guidanceLayer: "todayOrdersSnapshot",
      value: String(ordersThisMonth),
      href: "/orders",
      icon: ClipboardList,
    },
    {
      id: "revenue",
      label: "Revenue",
      guidanceLayer: "revenueThisMonth",
      value: formatPrice(kpis.revenueThisMonth),
      href: "/finance",
      icon: DollarSign,
    },
    {
      id: "active-projects",
      label: "Active projects",
      guidanceLayer: "activeProjects",
      value: String(kpis.activeProjects),
      href: "/projects",
      icon: FolderKanban,
    },
    {
      id: "pending-payments",
      label: "Pending payments",
      guidanceLayer: "pendingCollections",
      value: formatPrice(kpis.outstandingPayments),
      href: "/finance",
      icon: Wallet,
    },
    {
      id: "team",
      label: "Team members",
      guidanceLayer: "teamAvailability",
      value: String(teamMembers),
      href: "/people",
      icon: UsersRound,
    },
  ];
}

interface FounderKpiRowProps {
  kpis: DashboardKpis;
  ordersThisMonth: number;
  teamMembers: number;
}

export function FounderKpiRow({
  kpis,
  ordersThisMonth,
  teamMembers,
}: FounderKpiRowProps) {
  const metrics = buildKpis(kpis, ordersThisMonth, teamMembers);

  return (
    <section aria-label="Key performance indicators">
      <div
        className="soda-founder-kpi-row soda-stagger-children grid grid-cols-2 gap-2 lg:grid-cols-5"
        role="list"
      >
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.id}
              href={m.href}
              role="listitem"
              className={cn(
                "soda-founder-metric group flex min-w-0 flex-col gap-1 rounded-lg border border-border/60 bg-card/60 px-3 py-2.5 transition-colors",
                "hover:border-soda-pink/35 hover:bg-soda-pink/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <div className="flex items-center gap-2">
                <div className="soda-kpi-icon-pink flex size-7 shrink-0 items-center justify-center rounded-md">
                  <Icon className="size-3.5" aria-hidden />
                </div>
                <p className="truncate text-sm font-semibold text-foreground">
                  {m.label}
                </p>
              </div>
              <p className="font-mono text-xl font-bold tabular-nums leading-none">
                {m.value}
              </p>
              <SodaLanguage
                layer={m.guidanceLayer}
                size="compact"
                className="hidden truncate sm:block"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
