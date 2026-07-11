/**
 * Financial calculators — all balances derived from immutable events + allocations.
 * No stored balances. Projects never own wallets; project figures are attribution only.
 */

import {
  getAllocatedTotalForEvent,
  getFinancialEventById,
  getUnallocatedAmount,
  listAllocationsByEvent,
  listAllocationsByTarget,
  listFinancialEvents,
} from "@/lib/finance/repository";
import { getCompanyBalance, getCompanyWallet } from "@/lib/finance/company";
import type {
  CompanyWallet,
  Currency,
  FinancialAllocation,
  FinancialEvent,
} from "@/lib/finance/types";

const DEFAULT_CURRENCY: Currency = "EGP";

export interface CashFlowFilter {
  /** Inclusive ISO lower bound on occurredAt. */
  from?: string;
  /** Inclusive ISO upper bound on occurredAt. */
  to?: string;
  currency?: Currency;
}

export interface CashFlowResult {
  currency: Currency;
  inflow: number;
  outflow: number;
  net: number;
  eventCount: number;
}

export interface ProjectFinanceResult {
  projectId: string;
  currency: Currency;
  revenue: number;
  cost: number;
  profit: number;
}

function eventsForCurrency(
  currency: Currency,
  filter: { from?: string; to?: string } = {}
): FinancialEvent[] {
  return listFinancialEvents({
    from: filter.from,
    to: filter.to,
  }).filter((e) => e.currency === currency);
}

/**
 * Attribute an amount on an event to a project without double-counting:
 * - Allocation slices targeting the project
 * - Plus any unallocated remainder when the event's parent is that project
 */
function projectAttributedSlices(
  projectId: string,
  currency: Currency
): Array<{ amount: number; direction: FinancialEvent["direction"]; type: FinancialEvent["type"] }> {
  const slices: Array<{
    amount: number;
    direction: FinancialEvent["direction"];
    type: FinancialEvent["type"];
  }> = [];

  const toProject = listAllocationsByTarget("project", projectId);
  for (const allocation of toProject) {
    const event = getFinancialEventById(allocation.financialEventId);
    if (!event || event.currency !== currency) continue;
    slices.push({
      amount: allocation.amount,
      direction: event.direction,
      type: event.type,
    });
  }

  const parentEvents = listFinancialEvents({
    parentType: "project",
    parentId: projectId,
  }).filter((e) => e.currency === currency);

  for (const event of parentEvents) {
    const remainder = getUnallocatedAmount(event.id);
    if (remainder <= 0) continue;
    slices.push({
      amount: remainder,
      direction: event.direction,
      type: event.type,
    });
  }

  // Crew payments / expenses tagged with metadata.projectId (assignment alloc
  // may consume the event; still attribute cost to the project once).
  const tagged = listFinancialEvents().filter(
    (e) =>
      e.currency === currency &&
      (e.type === "crew_payment" || e.type === "expense") &&
      e.metadata?.projectId === projectId
  );
  const projectAllocEventIds = new Set(
    toProject.map((a) => a.financialEventId)
  );
  for (const event of tagged) {
    if (projectAllocEventIds.has(event.id)) continue;
    if (
      event.parent.parentType === "project" &&
      event.parent.parentId === projectId
    ) {
      continue; // already handled via parent remainder
    }
    slices.push({
      amount: event.amount,
      direction: event.direction,
      type: event.type,
    });
  }

  return slices;
}

/** Company balance (inflow − outflow). Re-export of company helper. */
export function calculateCompanyBalance(
  currency: Currency = DEFAULT_CURRENCY
): number {
  return getCompanyBalance(currency);
}

/** Company cash position — same computed wallet balance (no separate cash store). */
export function calculateCompanyCash(
  currency: Currency = DEFAULT_CURRENCY
): number {
  return getCompanyWallet(currency).balance;
}

/** Full computed company wallet. */
export function calculateCompanyWallet(
  currency: Currency = DEFAULT_CURRENCY
): CompanyWallet {
  return getCompanyWallet(currency);
}

/**
 * Net client payments received for a client (inflows − refund outflows)
 * from events parented to the client.
 */
export function calculateClientPaid(
  clientId: string,
  currency: Currency = DEFAULT_CURRENCY
): number {
  const events = listFinancialEvents({
    parentType: "client",
    parentId: clientId,
  }).filter((e) => e.currency === currency);

  let paid = 0;
  for (const event of events) {
    if (event.type === "client_payment" && event.direction === "inflow") {
      paid += event.amount;
    } else if (event.type === "refund" && event.direction === "outflow") {
      paid -= event.amount;
    }
  }
  return paid;
}

/**
 * Client outstanding = obligatedTotal − net paid.
 * `obligatedTotal` is supplied by Orders/Invoices until those modules emit into finance.
 */
export function calculateClientOutstandingBalance(
  clientId: string,
  obligatedTotal: number,
  currency: Currency = DEFAULT_CURRENCY
): number {
  if (!Number.isFinite(obligatedTotal) || obligatedTotal < 0) {
    throw new Error("obligatedTotal must be a finite number ≥ 0");
  }
  return Math.max(0, obligatedTotal - calculateClientPaid(clientId, currency));
}

/**
 * Cash paid out to a person/crew member (crew_payment outflows parented to crew).
 */
export function calculatePersonPaid(
  personId: string,
  currency: Currency = DEFAULT_CURRENCY
): number {
  return listFinancialEvents({
    parentType: "crew",
    parentId: personId,
    type: "crew_payment",
    direction: "outflow",
  })
    .filter((e) => e.currency === currency)
    .reduce((acc, e) => acc + e.amount, 0);
}

/**
 * Person balance owed by the company = obligatedTotal − paid.
 * `obligatedTotal` comes from Crew/Assignments until integration.
 * When omitted, returns net paid (ledger cash out to person) as a negative-free paid total.
 */
export function calculatePersonBalance(
  personId: string,
  obligatedTotal?: number,
  currency: Currency = DEFAULT_CURRENCY
): number {
  const paid = calculatePersonPaid(personId, currency);
  if (obligatedTotal === undefined) {
    return paid;
  }
  if (!Number.isFinite(obligatedTotal) || obligatedTotal < 0) {
    throw new Error("obligatedTotal must be a finite number ≥ 0");
  }
  return Math.max(0, obligatedTotal - paid);
}

/** Project revenue — inflow amounts attributed to the project. */
export function calculateProjectRevenue(
  projectId: string,
  currency: Currency = DEFAULT_CURRENCY
): number {
  return projectAttributedSlices(projectId, currency)
    .filter((s) => s.direction === "inflow")
    .reduce((acc, s) => acc + s.amount, 0);
}

/** Project cost — outflow amounts attributed to the project (not a wallet). */
export function calculateProjectCost(
  projectId: string,
  currency: Currency = DEFAULT_CURRENCY
): number {
  return projectAttributedSlices(projectId, currency)
    .filter((s) => s.direction === "outflow")
    .reduce((acc, s) => acc + s.amount, 0);
}

/** Project profit = revenue − cost (attribution only; project holds no cash). */
export function calculateProjectProfit(
  projectId: string,
  currency: Currency = DEFAULT_CURRENCY
): number {
  return (
    calculateProjectRevenue(projectId, currency) -
    calculateProjectCost(projectId, currency)
  );
}

export function calculateProjectFinance(
  projectId: string,
  currency: Currency = DEFAULT_CURRENCY
): ProjectFinanceResult {
  const revenue = calculateProjectRevenue(projectId, currency);
  const cost = calculateProjectCost(projectId, currency);
  return {
    projectId,
    currency,
    revenue,
    cost,
    profit: revenue - cost,
  };
}

/** Period cash flow from company events (inflow / outflow / net). */
export function calculateCashFlow(filter: CashFlowFilter = {}): CashFlowResult {
  const currency = filter.currency ?? DEFAULT_CURRENCY;
  const events = eventsForCurrency(currency, {
    from: filter.from,
    to: filter.to,
  });

  let inflow = 0;
  let outflow = 0;
  for (const event of events) {
    if (event.direction === "inflow") inflow += event.amount;
    else outflow += event.amount;
  }

  return {
    currency,
    inflow,
    outflow,
    net: inflow - outflow,
    eventCount: events.length,
  };
}

/** Allocations for an event (read helper for engine consumers). */
export function listEventAllocationState(financialEventId: string): {
  allocations: FinancialAllocation[];
  allocatedTotal: number;
  unallocatedAmount: number;
} {
  return {
    allocations: listAllocationsByEvent(financialEventId),
    allocatedTotal: getAllocatedTotalForEvent(financialEventId),
    unallocatedAmount: getUnallocatedAmount(financialEventId),
  };
}
