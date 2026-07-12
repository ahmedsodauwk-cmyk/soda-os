import { cache } from "react";

import { refreshAssignments } from "@/lib/assignments/repository";
import { refreshClients } from "@/lib/clients/repository";
import { bootstrapBusinessCore } from "@/lib/core/bootstrap";
import { refreshEquipment } from "@/lib/equipment/repository";
import { refreshFiles } from "@/lib/files/repository";
import { refreshPeriodClosings } from "@/lib/finance/closing";
import { refreshExpenses } from "@/lib/finance/expenses";
import { refreshFinance } from "@/lib/finance/repository";
import { refreshTransfers } from "@/lib/finance/transfers";
import { refreshInvoices } from "@/lib/invoices/repository";
import { refreshOrders } from "@/lib/orders/repository";
import { refreshPayments } from "@/lib/payments/repository";
import { refreshPeople } from "@/lib/people/repository";
import { refreshProjects } from "@/lib/projects/repository";
import { refreshQuotations } from "@/lib/quotations/repository";
import { ensureTaxonomyPersisted } from "@/lib/taxonomy/persist";
import {
  ensureDefaultCashAccounts,
  refreshCashAccounts,
  refreshCashMovements,
} from "@/lib/wallets/cash-accounts";
import { refreshCrewEarnings } from "@/lib/wallets/crew-wallet";

/** Warm-instance TTL — skip full Supabase fan-out on rapid navigations. */
const REFRESH_TTL_MS = 20_000;

type RefreshKind = "all" | "dashboard";

let lastRefreshAt: Partial<Record<RefreshKind, number>> = {};
let inFlight: Partial<Record<RefreshKind, Promise<void>>> = {};

function isFresh(kind: RefreshKind): boolean {
  const at = lastRefreshAt[kind];
  return at != null && Date.now() - at < REFRESH_TTL_MS;
}

function markFresh(kind: RefreshKind): void {
  const now = Date.now();
  lastRefreshAt[kind] = now;
  // Full refresh also satisfies dashboard freshness.
  if (kind === "all") lastRefreshAt.dashboard = now;
}

async function runRefresh(kind: RefreshKind, work: () => Promise<void>) {
  if (isFresh(kind)) return;
  if (kind === "dashboard" && isFresh("all")) return;

  const existing = inFlight[kind] ?? (kind === "dashboard" ? inFlight.all : undefined);
  if (existing) {
    await existing;
    return;
  }

  const promise = (async () => {
    try {
      await work();
      markFresh(kind);
    } finally {
      delete inFlight[kind];
    }
  })();

  inFlight[kind] = promise;
  await promise;
}

/**
 * Domains required for Home / Command Center aggregators + activity feed.
 * Avoids equipment/files/period-closing fan-out on every home hit.
 */
async function refreshDashboardDomainsInner(): Promise<void> {
  bootstrapBusinessCore();
  await ensureTaxonomyPersisted();
  await Promise.all([
    refreshClients(),
    refreshPeople(),
    refreshProjects(),
    refreshOrders(),
    refreshAssignments(),
    refreshQuotations(),
    refreshPayments(),
    refreshInvoices(),
    refreshFinance(),
    refreshCashAccounts(),
    refreshCashMovements(),
    refreshCrewEarnings(),
  ]);
  await ensureDefaultCashAccounts();
}

async function refreshAllDomainDataInner(): Promise<void> {
  bootstrapBusinessCore();
  await ensureTaxonomyPersisted();
  await Promise.all([
    refreshClients(),
    refreshPeople(),
    refreshEquipment(),
    refreshProjects(),
    refreshOrders(),
    refreshAssignments(),
    refreshQuotations(),
    refreshPayments(),
    refreshInvoices(),
    refreshFinance(),
    refreshFiles(),
    refreshCashAccounts(),
    refreshCashMovements(),
    refreshCrewEarnings(),
    refreshExpenses(),
    refreshTransfers(),
    refreshPeriodClosings(),
  ]);
  await ensureDefaultCashAccounts();
}

/** Full domain refresh — Statistics, Me, wallet, smoke scripts. */
export async function refreshAllDomainData(): Promise<void> {
  await runRefresh("all", refreshAllDomainDataInner);
}

/**
 * Lean refresh for Home / Command Center.
 * Deduped per request via cache(); TTL-gated across warm instances.
 */
export const refreshDashboardDomainData = cache(async (): Promise<void> => {
  await runRefresh("dashboard", refreshDashboardDomainsInner);
});

/** Test / scripts — force a full refresh ignoring TTL. */
export async function forceRefreshAllDomainData(): Promise<void> {
  lastRefreshAt = {};
  inFlight = {};
  await refreshAllDomainDataInner();
  markFresh("all");
}
