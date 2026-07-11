/**
 * Financial Engine repository — append-only in-memory ledger.
 * Events are immutable: no update/delete APIs.
 */

import {
  financialAllocations,
  financialEvents,
} from "@/lib/finance/seed";
import type {
  FinanceSummary,
  FinancialAllocation,
  FinancialEvent,
  Invoice,
  ListFinancialEventsFilter,
  NewFinancialAllocationInput,
  NewFinancialEventInput,
} from "@/lib/finance/types";
import {
  validateNewFinancialAllocation,
  validateNewFinancialEvent,
} from "@/lib/finance/validation";

function nowIso(): string {
  return new Date().toISOString();
}

function nextEventId(): string {
  return `fe-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function nextAllocationId(): string {
  return `fa-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Append-only: create an immutable Financial Event. */
export function createFinancialEvent(
  input: NewFinancialEventInput
): FinancialEvent {
  const validated = validateNewFinancialEvent(input);
  const createdAt = nowIso();
  const event: FinancialEvent = {
    id: nextEventId(),
    type: validated.type,
    amount: validated.amount,
    currency: validated.currency,
    direction: validated.direction,
    occurredAt: validated.occurredAt ?? createdAt,
    createdAt,
    createdBy: validated.createdBy,
    notes: validated.notes,
    parent: validated.parent,
    metadata: validated.metadata,
    paymentId: validated.paymentId,
    invoiceId: validated.invoiceId,
  };

  financialEvents.push(event);
  return { ...event };
}

export function getFinancialEventById(id: string): FinancialEvent | undefined {
  const event = financialEvents.find((e) => e.id === id);
  return event ? { ...event } : undefined;
}

export function listFinancialEvents(
  filter: ListFinancialEventsFilter = {}
): FinancialEvent[] {
  return financialEvents
    .filter((e) => {
      if (filter.parentType && e.parent.parentType !== filter.parentType) {
        return false;
      }
      if (filter.parentId && e.parent.parentId !== filter.parentId) {
        return false;
      }
      if (filter.type && e.type !== filter.type) return false;
      if (filter.direction && e.direction !== filter.direction) return false;
      if (filter.from && e.occurredAt < filter.from) return false;
      if (filter.to && e.occurredAt > filter.to) return false;
      if (filter.paymentId && e.paymentId !== filter.paymentId) return false;
      if (filter.invoiceId && e.invoiceId !== filter.invoiceId) return false;
      return true;
    })
    .map((e) => ({ ...e }))
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

/** Allocated total for an event (does not mutate). */
export function getAllocatedTotalForEvent(financialEventId: string): number {
  return financialAllocations
    .filter((a) => a.financialEventId === financialEventId)
    .reduce((acc, a) => acc + a.amount, 0);
}

/** Remaining amount that can still be allocated on an event. */
export function getUnallocatedAmount(financialEventId: string): number {
  const event = financialEvents.find((e) => e.id === financialEventId);
  if (!event) return 0;
  return Math.max(0, event.amount - getAllocatedTotalForEvent(financialEventId));
}

/**
 * Create an allocation against an event.
 * Sum of allocations must not exceed the event amount.
 */
export function createAllocation(
  input: NewFinancialAllocationInput
): FinancialAllocation {
  const event = financialEvents.find((e) => e.id === input.financialEventId);
  const already = getAllocatedTotalForEvent(input.financialEventId);
  const validated = validateNewFinancialAllocation(input, event, already);

  const allocation: FinancialAllocation = {
    id: nextAllocationId(),
    financialEventId: validated.financialEventId,
    amount: validated.amount,
    targetType: validated.targetType,
    targetId: validated.targetId,
    note: validated.note,
  };

  financialAllocations.push(allocation);
  return { ...allocation };
}

export function listAllocationsByEvent(
  financialEventId: string
): FinancialAllocation[] {
  return financialAllocations
    .filter((a) => a.financialEventId === financialEventId)
    .map((a) => ({ ...a }));
}

export function listAllocationsByTarget(
  targetType: FinancialAllocation["targetType"],
  targetId: string
): FinancialAllocation[] {
  return financialAllocations
    .filter((a) => a.targetType === targetType && a.targetId === targetId)
    .map((a) => ({ ...a }));
}

/** All allocations (copies) — for calculators / diagnostics. */
export function listAllAllocations(): FinancialAllocation[] {
  return financialAllocations.map((a) => ({ ...a }));
}

/**
 * Events are immutable — update is not supported.
 * @throws always
 */
export function updateFinancialEvent(_id: string, _patch: unknown): never {
  void _id;
  void _patch;
  throw new Error("Financial Events are immutable and cannot be updated");
}

/**
 * Events are immutable — delete is not supported.
 * @throws always
 */
export function deleteFinancialEvent(_id: string): never {
  void _id;
  throw new Error("Financial Events are immutable and cannot be deleted");
}

/** Legacy stub — commercial invoices live in lib/invoices. */
export function getInvoices(): Invoice[] {
  return [];
}

/**
 * Studio rollup. Built on the engine so empty stores yield zeros;
 * client_payment inflows count as revenuePaid.
 */
export function getFinanceSummary(): FinanceSummary {
  const paid = listFinancialEvents({
    type: "client_payment",
    direction: "inflow",
  }).reduce((acc, e) => acc + e.amount, 0);

  return {
    revenuePaid: paid,
    revenuePending: 0,
    outstandingBalance: 0,
    currency: "EGP",
  };
}
