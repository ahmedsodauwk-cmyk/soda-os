/**
 * Role-aware Home section registry — shared V3 shell, scoped panels/KPIs.
 * Executable permissions + data scope drive visibility; never fetch-then-hide finance.
 */

import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  Package,
  UsersRound,
  Wallet,
} from "lucide-react";

import type { HumanLayerKey } from "@/lib/brand/human-layer";
import type {
  AttentionItem,
  DashboardKpis,
  DashboardSnapshot,
} from "@/lib/dashboard/types";
import type { AccessLevel } from "@/lib/identity/access-levels";
import type { DataScope } from "@/lib/identity/data-scope";
import type { Permission } from "@/lib/identity/permissions";
import { setHasAny } from "@/lib/identity/permissions";
import type { Order } from "@/lib/orders/types";
import type { Quotation } from "@/lib/quotations/types";
import { isOrderActiveWorkload } from "@/lib/orders/status";

/** Finance attention categories — Founder only on Home hero + panels. */
export const FINANCE_ATTENTION_CATEGORIES = new Set([
  "unpaid_client",
  "waiting_payment",
]);

export type HomeKpiMetric = {
  id: string;
  label: string;
  guidanceLayer: HumanLayerKey;
  value: string;
  href: string;
  icon: LucideIcon;
};

export type RoleHomePanelCopy = {
  ops1: { title: string; layer: HumanLayerKey };
  ops2: { title: string; layer: HumanLayerKey };
  ops3: { title: string; layer: HumanLayerKey };
  mgmt1: { title: string; layer: HumanLayerKey };
  mgmt2: { title: string; layer: HumanLayerKey };
  lower1: { title: string; layer: HumanLayerKey };
  lower2: { title: string; layer: HumanLayerKey };
};

const PANEL_COPY: Record<Exclude<AccessLevel, "founder">, RoleHomePanelCopy> = {
  account_manager: {
    ops1: { title: "My Quotations", layer: "quotationPipeline" },
    ops2: { title: "My Pipeline", layer: "quotationPipeline" },
    ops3: { title: "My Orders", layer: "todayOperations" },
    mgmt1: { title: "Client Follow-ups", layer: "needsYourDecision" },
    mgmt2: { title: "My Schedule", layer: "todayOperations" },
    lower1: { title: "Recent Client Orders", layer: "todayOperations" },
    lower2: { title: "My Updates", layer: "sodaLive" },
  },
  team_leader: {
    ops1: { title: "Team Orders", layer: "todayOperations" },
    ops2: { title: "Team Schedule", layer: "teamAvailability" },
    ops3: { title: "Pending Deliveries", layer: "todayOperations" },
    mgmt1: { title: "Team Attention", layer: "needsYourDecision" },
    mgmt2: { title: "Assignments", layer: "teamAvailability" },
    lower1: { title: "Recent Team Orders", layer: "todayOperations" },
    lower2: { title: "Team Updates", layer: "sodaLive" },
  },
  team: {
    ops1: { title: "My Orders", layer: "todayOperations" },
    ops2: { title: "My Schedule", layer: "todayOperations" },
    ops3: { title: "My Tasks", layer: "todayOperations" },
    mgmt1: { title: "Today's Focus", layer: "todayOperations" },
    mgmt2: { title: "My Workspace", layer: "dashboard" },
    lower1: { title: "My Recent Orders", layer: "todayOperations" },
    lower2: { title: "My Updates", layer: "sodaLive" },
  },
};

export function getRoleHomePanelCopy(
  level: Exclude<AccessLevel, "founder">
): RoleHomePanelCopy {
  return PANEL_COPY[level];
}

export function filterAttentionForHome(
  items: AttentionItem[],
  level: AccessLevel
): AttentionItem[] {
  if (level === "founder") return items;
  return items.filter((a) => !FINANCE_ATTENTION_CATEGORIES.has(a.category));
}

export function canShowCompanyFinance(
  level: AccessLevel,
  allowed?: readonly string[]
): boolean {
  if (level !== "founder") return false;
  if (!allowed) return false;
  return setHasAny(allowed, [
    "finance.view",
    "dashboard.finance",
  ] as Permission[]);
}

export function buildRoleKpiMetrics(
  level: Exclude<AccessLevel, "founder">,
  input: {
    kpis: DashboardKpis;
    scopedOrders: Order[];
    pendingQuotations: Quotation[];
    teamMembers: number;
    shootsToday: number;
    showWallet: boolean;
  }
): HomeKpiMetric[] {
  const {
    kpis,
    scopedOrders,
    pendingQuotations,
    teamMembers,
    shootsToday,
    showWallet,
  } = input;
  const activeOrders = scopedOrders.filter((o) =>
    isOrderActiveWorkload(o.status)
  );

  if (level === "account_manager") {
    return [
      {
        id: "quotes",
        label: "Pending quotations",
        guidanceLayer: "quotationPipeline",
        value: String(pendingQuotations.length),
        href: "/quotations",
        icon: FileText,
      },
      {
        id: "orders",
        label: "Active orders",
        guidanceLayer: "todayOrdersSnapshot",
        value: String(activeOrders.length),
        href: "/orders",
        icon: ClipboardList,
      },
      {
        id: "shoots",
        label: "Upcoming shoots",
        guidanceLayer: "todayOperations",
        value: String(kpis.upcomingShoots),
        href: "/calendar",
        icon: CalendarDays,
      },
      {
        id: "deliveries",
        label: "Upcoming deliveries",
        guidanceLayer: "todayOperations",
        value: String(kpis.upcomingDeliveries),
        href: "/schedule/deliveries",
        icon: Package,
      },
    ];
  }

  if (level === "team_leader") {
    return [
      {
        id: "team-orders",
        label: "Team orders",
        guidanceLayer: "todayOrdersSnapshot",
        value: String(scopedOrders.length),
        href: "/orders",
        icon: ClipboardList,
      },
      {
        id: "today-shoots",
        label: "Shoots today",
        guidanceLayer: "todayOperations",
        value: String(shootsToday),
        href: "/schedule/today",
        icon: CalendarDays,
      },
      {
        id: "deliveries",
        label: "Upcoming deliveries",
        guidanceLayer: "todayOperations",
        value: String(kpis.upcomingDeliveries),
        href: "/schedule/deliveries",
        icon: Package,
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

  const metrics: HomeKpiMetric[] = [
    {
      id: "my-orders",
      label: "My orders",
      guidanceLayer: "todayOrdersSnapshot",
      value: String(scopedOrders.length),
      href: "/orders",
      icon: ClipboardList,
    },
    {
      id: "active",
      label: "Active work",
      guidanceLayer: "todayOperations",
      value: String(activeOrders.length),
      href: "/orders",
      icon: Package,
    },
    {
      id: "shoots",
      label: "Upcoming shoots",
      guidanceLayer: "todayOperations",
      value: String(kpis.upcomingShoots),
      href: "/calendar",
      icon: CalendarDays,
    },
  ];

  if (showWallet) {
    metrics.push({
      id: "wallet",
      label: "My wallet",
      guidanceLayer: "dashboard",
      value: "→",
      href: "/me/wallet",
      icon: Wallet,
    });
  }

  return metrics;
}

/** Strip finance from voice input before hero / panels for non-Founder. */
export function scopeVoiceInputForHome(
  dashboard: DashboardSnapshot,
  level: AccessLevel
): Pick<DashboardSnapshot, "kpis" | "attention" | "schedule"> {
  if (level === "founder") {
    return {
      kpis: dashboard.kpis,
      attention: dashboard.attention,
      schedule: dashboard.schedule,
    };
  }
  return {
    kpis: dashboard.kpis,
    attention: filterAttentionForHome(dashboard.attention, level),
    schedule: dashboard.schedule,
  };
}

/** Activity feed scoping — never include company payments for non-Founder. */
export function activityFeedScopeFromDataScope(
  scope: DataScope
): {
  orderIds: Set<string> | null;
  personIds: Set<string> | null;
  includePayments: boolean;
} {
  if (scope.accessLevel === "founder") {
    return { orderIds: null, personIds: null, includePayments: true };
  }
  return {
    orderIds: scope.orderIds,
    personIds: scope.personIds,
    includePayments: false,
  };
}
