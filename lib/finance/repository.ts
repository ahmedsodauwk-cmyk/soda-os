/**
 * Financial Engine repository — append-only ledger on Supabase.
 * Events are immutable: no update/delete APIs.
 */

import { createFinanceDb } from "@/lib/finance/db";
import {
  allocationToRow,
  eventToRow,
  rowToAllocation,
  rowToEvent,
  type FinancialAllocationRow,
  type FinancialEventRow,
} from "@/lib/finance/mappers";
import { listOrderFinancialSnapshots } from "@/lib/finance/order-status";
import { assertPeriodOpen } from "@/lib/finance/period-guard";
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

let eventsCache: FinancialEvent[] = [];
let allocationsCache: FinancialAllocation[] = [];

function nowIso(): string {
  return new Date().toISOString();
}

function nextEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `fe-${crypto.randomUUID()}`;
  }
  return `fe-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function nextAllocationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `fa-${crypto.randomUUID()}`;
  }
  return `fa-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function refreshFinance(): Promise<void> {
  const db = createFinanceDb();
  const [ev, al] = await Promise.all([
    db
      .from("financial_events")
      .select("*")
      .order("occurred_at", { ascending: false }),
    db.from("financial_allocations").select("*"),
  ]);
  if (ev.error) {
    throw new Error(`Failed to load financial events: ${ev.error.message}`);
  }
  if (al.error) {
    throw new Error(
      `Failed to load financial allocations: ${al.error.message}`
    );
  }
  eventsCache = ((ev.data ?? []) as FinancialEventRow[]).map(rowToEvent);
  allocationsCache = ((al.data ?? []) as FinancialAllocationRow[]).map(
    rowToAllocation
  );
}

/** Append-only: create an immutable Financial Event. */
export async function createFinancialEvent(
  input: NewFinancialEventInput
): Promise<FinancialEvent> {
  const validated = validateNewFinancialEvent(input);
  const createdAt = nowIso();
  const occurredAt = validated.occurredAt ?? createdAt;
  assertPeriodOpen(occurredAt, "create financial event");
  const event: FinancialEvent = {
    id: nextEventId(),
    type: validated.type,
    amount: validated.amount,
    currency: validated.currency,
    direction: validated.direction,
    occurredAt,
    createdAt,
    createdBy: validated.createdBy,
    notes: validated.notes,
    parent: validated.parent,
    metadata: validated.metadata,
    paymentId: validated.paymentId,
    invoiceId: validated.invoiceId,
  };

  const db = createFinanceDb();
  const { data, error } = await db
    .from("financial_events")
    .insert(eventToRow(event))
    .select("*")
    .single();
  if (error) {
    throw new Error(`Failed to create financial event: ${error.message}`);
  }
  const saved = rowToEvent(data as FinancialEventRow);
  eventsCache = [saved, ...eventsCache];
  return { ...saved };
}

export function getFinancialEventById(id: string): FinancialEvent | undefined {
  const event = eventsCache.find((e) => e.id === id);
  return event ? { ...event } : undefined;
}

export function listFinancialEvents(
  filter: ListFinancialEventsFilter = {}
): FinancialEvent[] {
  return eventsCache
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

export function getAllocatedTotalForEvent(financialEventId: string): number {
  return allocationsCache
    .filter((a) => a.financialEventId === financialEventId)
    .reduce((acc, a) => acc + a.amount, 0);
}

export function getUnallocatedAmount(financialEventId: string): number {
  const event = eventsCache.find((e) => e.id === financialEventId);
  if (!event) return 0;
  return Math.max(0, event.amount - getAllocatedTotalForEvent(financialEventId));
}

export async function createAllocation(
  input: NewFinancialAllocationInput
): Promise<FinancialAllocation> {
  const event = eventsCache.find((e) => e.id === input.financialEventId);
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

  const db = createFinanceDb();
  const { data, error } = await db
    .from("financial_allocations")
    .insert(allocationToRow(allocation))
    .select("*")
    .single();
  if (error) {
    throw new Error(`Failed to create allocation: ${error.message}`);
  }
  const saved = rowToAllocation(data as FinancialAllocationRow);
  allocationsCache = [saved, ...allocationsCache];
  return { ...saved };
}

export function listAllocationsByEvent(
  financialEventId: string
): FinancialAllocation[] {
  return allocationsCache
    .filter((a) => a.financialEventId === financialEventId)
    .map((a) => ({ ...a }));
}

export function listAllocationsByTarget(
  targetType: FinancialAllocation["targetType"],
  targetId: string
): FinancialAllocation[] {
  return allocationsCache
    .filter((a) => a.targetType === targetType && a.targetId === targetId)
    .map((a) => ({ ...a }));
}

export function listAllAllocations(): FinancialAllocation[] {
  return allocationsCache.map((a) => ({ ...a }));
}

export function updateFinancialEvent(_id: string, _patch: unknown): never {
  void _id;
  void _patch;
  throw new Error("Financial Events are immutable and cannot be updated");
}

export function deleteFinancialEvent(_id: string): never {
  void _id;
  throw new Error("Financial Events are immutable and cannot be deleted");
}

export function getInvoices(): Invoice[] {
  return [];
}

export function getFinanceSummary(): FinanceSummary {
  const paid = listFinancialEvents({
    type: "client_payment",
    direction: "inflow",
  }).reduce((acc, e) => acc + e.amount, 0);

  const outstanding = listOrderFinancialSnapshots().reduce(
    (acc, s) => acc + s.outstanding,
    0
  );

  return {
    revenuePaid: paid,
    revenuePending: outstanding,
    outstandingBalance: outstanding,
    currency: "EGP",
  };
}
