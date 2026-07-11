/**
 * Business Core aggregators — dashboard / reporting / client profile.
 * Pages read from here; they must not invent ad-hoc math.
 * Financial figures come ONLY from Financial Core (ledger + wallets + cashflow).
 */

import { getBusinessToday } from "@/lib/business/types";
import {
  clearStatsDirty,
  getStatsGeneration,
  getStatsMeta,
  isDashboardDirty,
} from "@/lib/core/stats/engine";
import {
  getFinanceHookSnapshot,
} from "@/lib/core/finance/hooks";
import { buildDashboardSnapshot } from "@/lib/dashboard/stats";
import type {
  DashboardSnapshot,
  FinancialOverview,
} from "@/lib/dashboard/types";
import { getCompanyCashflow } from "@/lib/finance/cashflow";
import { getCompanyWallet } from "@/lib/finance/company";
import {
  listOrderFinancialSnapshots,
} from "@/lib/finance/order-status";
import { listFinancialEvents } from "@/lib/finance/repository";
import { getClients } from "@/lib/clients/repository";
import { getOrders } from "@/lib/orders/repository";
import { isOrderCompleted } from "@/lib/orders/status";
import { getPayments } from "@/lib/payments/repository";
import { getProjects } from "@/lib/projects/repository";
import { getWorkspaceSummaries } from "@/lib/workspaces/repository";
import {
  getCompanyMethodWallets,
} from "@/lib/wallets/cash-accounts";
import { getTotalPendingCrewPayments } from "@/lib/wallets/crew-wallet";
import type {
  ClientProfileStats,
  FinancialReportSnapshot,
} from "@/lib/wallets/types";

let dashboardCache: DashboardSnapshot | null = null;
let dashboardGeneration = -1;

function monthKey(asOf: string): string {
  return asOf.slice(0, 7);
}

function yearKey(asOf: string): string {
  return asOf.slice(0, 4);
}

/** Financial overview from Financial Core — not ad-hoc payment math. */
export function getFinancialOverviewFromCore(): FinancialOverview {
  const snaps = listOrderFinancialSnapshots();
  const revenue = snaps.reduce((acc, s) => acc + s.agreed, 0);
  const collected = snaps.reduce((acc, s) => acc + s.collected, 0);
  const outstanding = snaps.reduce((acc, s) => acc + s.outstanding, 0);
  const deposits = getPayments()
    .filter((p) => p.kind === "deposit" && p.status === "paid")
    .reduce((acc, p) => acc + p.amount, 0);

  return {
    revenue,
    collected,
    outstanding,
    deposits,
    remainingBalance: outstanding,
  };
}

/** Rebuild dashboard snapshot from live domain caches (Business Core path). */
export function refreshDashboardAggregator(
  asOf: string = getBusinessToday()
): DashboardSnapshot {
  const base = buildDashboardSnapshot({
    projects: getProjects(),
    orders: getOrders(),
    clients: getClients(),
    payments: getPayments(),
    workspaceSummaries: getWorkspaceSummaries(),
    asOf,
  });

  const financial = getFinancialOverviewFromCore();
  const cashflow = getCompanyCashflow(asOf);
  const mk = monthKey(asOf);

  dashboardCache = {
    ...base,
    financial,
    kpis: {
      ...base.kpis,
      revenueThisMonth: cashflow.month.income,
      outstandingPayments: financial.outstanding,
    },
    monthlyRevenue: base.monthlyRevenue.map((p) =>
      p.key === mk
        ? { ...p, revenue: cashflow.month.income }
        : p
    ),
  };
  dashboardGeneration = getStatsGeneration();
  clearStatsDirty();
  return dashboardCache;
}

/**
 * Dashboard reads ONLY through Business Core.
 * Rebuilds when stats dirty / generation advanced.
 */
export function getDashboardFromBusinessCore(
  asOf?: string
): DashboardSnapshot {
  if (
    !dashboardCache ||
    isDashboardDirty() ||
    dashboardGeneration !== getStatsGeneration()
  ) {
    return refreshDashboardAggregator(asOf ?? getBusinessToday());
  }
  return dashboardCache;
}

export function getClientProfileStats(clientId: string): ClientProfileStats {
  const asOf = getBusinessToday();
  const mk = monthKey(asOf);
  const yk = yearKey(asOf);
  const orders = getOrders().filter(
    (o) => o.clientId === clientId && o.status !== "Cancelled"
  );

  const snaps = orders
    .map((o) =>
      listOrderFinancialSnapshots().find((s) => s.orderId === o.id)
    )
    .filter(Boolean);

  const revenue = snaps.reduce((acc, s) => acc + (s?.agreed ?? 0), 0);
  const collected = snaps.reduce((acc, s) => acc + (s?.collected ?? 0), 0);
  const outstanding = snaps.reduce((acc, s) => acc + (s?.outstanding ?? 0), 0);

  const shoots = orders
    .map((o) => o.shootDate)
    .filter(Boolean)
    .sort();
  const lastShoot =
    [...shoots].filter((d) => d <= asOf).sort().at(-1) ?? null;
  const nextShoot =
    shoots.find((d) => d > asOf) ?? null;

  return {
    clientId,
    totalOrders: orders.length,
    monthlyOrders: orders.filter(
      (o) => (o.shootDate || "").slice(0, 7) === mk
    ).length,
    yearlyOrders: orders.filter(
      (o) => (o.shootDate || "").slice(0, 4) === yk
    ).length,
    revenue,
    outstanding,
    collected: Math.max(0, collected),
    lastShoot,
    nextShoot,
    lifetimeValue: Math.max(0, collected),
  };
}

export function getFinancialReportSnapshot(
  asOf: string = getBusinessToday()
): FinancialReportSnapshot {
  const mk = monthKey(asOf);
  const yk = yearKey(asOf);
  const cashflow = getCompanyCashflow(asOf);
  const financial = getFinancialOverviewFromCore();
  const methods = getCompanyMethodWallets();
  const wallet = getCompanyWallet();

  return {
    asOf,
    monthKey: mk,
    yearKey: yk,
    monthlyRevenue: cashflow.month.income,
    yearlyRevenue: cashflow.year.income,
    outstanding: financial.outstanding,
    collected: financial.collected,
    cashSafe: methods.cashSafe,
    secondaryCashSafe: methods.secondaryCashSafe,
    bank: methods.bank,
    instapay: methods.instapay,
    vodafoneCash: methods.vodafoneCash,
    companyBalance: wallet.balance,
    pendingCrewPayments: getTotalPendingCrewPayments(),
    incomeToday: cashflow.today.income,
    expenseToday: cashflow.today.expense,
    incomeMonth: cashflow.month.income,
    expenseMonth: cashflow.month.expense,
    netProfitMonth: cashflow.netProfitMonth,
    incomeYear: cashflow.year.income,
    expenseYear: cashflow.year.expense,
    netProfitYear: cashflow.netProfitYear,
  };
}

export function getBusinessCoreHealth() {
  return {
    stats: getStatsMeta(),
    finance: getFinanceHookSnapshot(),
    eventCount: listFinancialEvents().length,
    completedOrders: getOrders().filter((o) => isOrderCompleted(o.status))
      .length,
  };
}
