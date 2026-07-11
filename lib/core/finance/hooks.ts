/**
 * Financial aggregator hooks — react to money-moving business events.
 * Reuses lib/finance calculators / company wallet; does not invent ledger writes.
 */

import type { BusinessEvent, BusinessEventType } from "@/lib/core/types";
import { calculateCompanyWallet } from "@/lib/finance/calculators";
import { getCompanyWallet } from "@/lib/finance/company";
import { getFinanceSummary, listFinancialEvents } from "@/lib/finance/repository";

const FINANCE_EVENTS: ReadonlySet<BusinessEventType> = new Set([
  "PaymentReceived",
  "PaymentUpdated",
  "InvoiceCreated",
  "InvoicePaid",
  "InvoiceUpdated",
  "OrderConfirmed",
  "OrderCompleted",
  "OrderCancelled",
  "CrewPaid",
  "QuotationConverted",
  "FinancialReversed",
  "FinancialVoided",
  "FinancialCorrected",
  "ExpenseRecorded",
  "TransferCompleted",
  "PeriodClosed",
  "PeriodReopened",
]);

export interface FinanceHookSnapshot {
  generation: number;
  lastEventId: string | null;
  lastEventType: BusinessEventType | null;
  lastWalletBalance: number | null;
  lastEventCount: number;
  dirty: boolean;
}

const snap: FinanceHookSnapshot = {
  generation: 0,
  lastEventId: null,
  lastEventType: null,
  lastWalletBalance: null,
  lastEventCount: 0,
  dirty: false,
};

/**
 * On finance-related events, refresh aggregator snapshot from live ledger.
 * Does not create financial events — those stay in finance/integration paths.
 */
export function runFinanceAggregatorHook(event: BusinessEvent): void {
  if (!FINANCE_EVENTS.has(event.type)) return;

  snap.generation += 1;
  snap.lastEventId = event.id;
  snap.lastEventType = event.type;
  snap.dirty = true;

  try {
    const events = listFinancialEvents();
    snap.lastEventCount = events.length;
    const wallet = calculateCompanyWallet();
    snap.lastWalletBalance = wallet.balance;
    // Touch public getters so callers see consistent derived state
    void getCompanyWallet();
    void getFinanceSummary();
  } catch (err) {
    console.warn(
      `[finance-hook] aggregator refresh failed: ${
        err instanceof Error ? err.message : err
      }`
    );
  }
}

export function getFinanceHookSnapshot(): FinanceHookSnapshot {
  return { ...snap };
}

export function clearFinanceHookDirty(): void {
  snap.dirty = false;
}
