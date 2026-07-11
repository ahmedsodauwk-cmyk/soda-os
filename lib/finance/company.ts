/**
 * Company money ownership helpers.
 * The company holds balances; projects never own wallets.
 */

import { financialEvents } from "@/lib/finance/seed";
import type {
  CompanyWallet,
  Currency,
  FinancialEvent,
} from "@/lib/finance/types";

const DEFAULT_CURRENCY: Currency = "EGP";

/** Signed contribution of an event to company cash (+ inflow, − outflow). */
export function eventSignedAmount(event: FinancialEvent): number {
  return event.direction === "inflow" ? event.amount : -event.amount;
}

/**
 * Compute company wallet from Financial Events.
 * Optional currency filter (defaults to EGP). Projects are ignored as owners.
 */
export function getCompanyWallet(currency: Currency = DEFAULT_CURRENCY): CompanyWallet {
  // Read live store (same array mutated by repository create APIs).
  const events = financialEvents.filter((e) => e.currency === currency);

  let totalInflow = 0;
  let totalOutflow = 0;

  for (const event of events) {
    if (event.direction === "inflow") {
      totalInflow += event.amount;
    } else {
      totalOutflow += event.amount;
    }
  }

  return {
    currency,
    balance: totalInflow - totalOutflow,
    totalInflow,
    totalOutflow,
    eventCount: events.length,
  };
}

/** Company cash balance (inflow − outflow) for a currency. */
export function getCompanyBalance(currency: Currency = DEFAULT_CURRENCY): number {
  return getCompanyWallet(currency).balance;
}

/**
 * Attribution total for a target (e.g. project) via allocations only.
 * This is NOT a wallet — projects do not hold money.
 */
export function sumAllocationsForTarget(
  targetType: string,
  targetId: string,
  allocations: { targetType: string; targetId: string; amount: number }[]
): number {
  return allocations
    .filter((a) => a.targetType === targetType && a.targetId === targetId)
    .reduce((acc, a) => acc + a.amount, 0);
}
