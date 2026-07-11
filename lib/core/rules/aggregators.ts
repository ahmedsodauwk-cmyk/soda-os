/**
 * Business Core aggregators — dashboard / reporting / client profile.
 * Pages read from here; they must not invent ad-hoc math.
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
import type { DashboardSnapshot } from "@/lib/dashboard/types";
import { getCompanyWallet } from "@/lib/finance/company";
import { listFinancialEvents } from "@/lib/finance/repository";
import { getClients } from "@/lib/clients/repository";
import { getOrders } from "@/lib/orders/repository";
import { isOrderBillable, isOrderCompleted } from "@/lib/orders/status";
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

/** Rebuild dashboard snapshot from live domain caches (Business Core path). */
export function refreshDashboardAggregator(
  asOf: string = getBusinessToday()
): DashboardSnapshot {
  dashboardCache = buildDashboardSnapshot({
    projects: getProjects(),
    orders: getOrders(),
    clients: getClients(),
    payments: getPayments(),
    workspaceSummaries: getWorkspaceSummaries(),
    asOf,
  });
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
  const payments = getPayments().filter(
    (p) => p.clientId === clientId && p.status === "paid" && p.kind !== "refund"
  );
  const refunds = getPayments().filter(
    (p) => p.clientId === clientId && p.status === "paid" && p.kind === "refund"
  );

  const billable = orders.filter((o) => isOrderBillable(o.status));
  const revenue = billable.reduce((acc, o) => acc + o.price, 0);
  const collected =
    payments.reduce((acc, p) => acc + p.amount, 0) -
    refunds.reduce((acc, p) => acc + p.amount, 0);
  const outstanding = Math.max(0, revenue - collected);

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
  const payments = getPayments().filter(
    (p) => p.status === "paid" && p.kind !== "refund"
  );
  const monthlyRevenue = payments
    .filter((p) => p.paidAt && p.paidAt.slice(0, 7) === mk)
    .reduce((acc, p) => acc + p.amount, 0);
  const yearlyRevenue = payments
    .filter((p) => p.paidAt && p.paidAt.slice(0, 4) === yk)
    .reduce((acc, p) => acc + p.amount, 0);

  const orders = getOrders().filter((o) => isOrderBillable(o.status));
  const revenue = orders.reduce((acc, o) => acc + o.price, 0);
  const collected = payments.reduce((acc, p) => acc + p.amount, 0);
  const outstanding = Math.max(0, revenue - collected);

  const methods = getCompanyMethodWallets();
  const wallet = getCompanyWallet();

  return {
    asOf,
    monthKey: mk,
    yearKey: yk,
    monthlyRevenue,
    yearlyRevenue,
    outstanding,
    collected,
    cashSafe: methods.cashSafe,
    bank: methods.bank,
    instapay: methods.instapay,
    vodafoneCash: methods.vodafoneCash,
    companyBalance: wallet.balance,
    pendingCrewPayments: getTotalPendingCrewPayments(),
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
