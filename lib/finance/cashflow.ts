/**
 * Company cashflow aggregators — today / month / year from Financial Core ledger.
 * Income = inflows; Expense = outflows. Pure transfers excluded from P&L.
 */

import { getBusinessToday } from "@/lib/business/types";
import { listFinancialEvents } from "@/lib/finance/repository";
import type { FinancialEvent } from "@/lib/finance/types";
import type { CompanyCashflowSnapshot } from "@/lib/finance/core-types";

function isTransferEvent(e: FinancialEvent): boolean {
  return (
    e.metadata?.category === "transfer" ||
    e.metadata?.kind === "transfer" ||
    e.metadata?.kind === "transfer_counter" ||
    e.metadata?.transferNetNeutral === true
  );
}

function isNeutralized(eventId: string, all: FinancialEvent[]): boolean {
  return all.some(
    (e) =>
      (e.metadata?.safetyAction === "reversal" ||
        e.metadata?.safetyAction === "void") &&
      e.metadata?.originalEventId === eventId
  );
}

function activeEvents(): FinancialEvent[] {
  const all = listFinancialEvents();
  return all.filter(
    (e) => !isNeutralized(e.id, all) && !isTransferEvent(e)
  );
}

function sumPeriod(
  events: FinancialEvent[],
  pred: (iso: string) => boolean
): { income: number; expense: number; net: number } {
  let income = 0;
  let expense = 0;
  for (const e of events) {
    if (!pred(e.occurredAt)) continue;
    if (e.direction === "inflow") income += e.amount;
    else expense += e.amount;
  }
  return { income, expense, net: income - expense };
}

export function getCompanyCashflow(
  asOf: string = getBusinessToday()
): CompanyCashflowSnapshot {
  const day = asOf.slice(0, 10);
  const monthKey = asOf.slice(0, 7);
  const yearKey = asOf.slice(0, 4);
  const events = activeEvents();

  const today = sumPeriod(events, (iso) => iso.slice(0, 10) === day);
  const month = {
    ...sumPeriod(events, (iso) => iso.slice(0, 7) === monthKey),
    key: monthKey,
  };
  const year = {
    ...sumPeriod(events, (iso) => iso.slice(0, 4) === yearKey),
    key: yearKey,
  };

  return {
    asOf: day,
    today,
    month,
    year,
    netProfitMonth: month.net,
    netProfitYear: year.net,
  };
}
