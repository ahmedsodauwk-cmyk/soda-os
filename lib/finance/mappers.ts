import type {
  AllocationTargetType,
  Currency,
  FinancialAllocation,
  FinancialDirection,
  FinancialEvent,
  FinancialEventType,
  FinancialParentType,
} from "@/lib/finance/types";

export type FinancialEventRow = {
  id: string;
  type: string;
  amount: number | string;
  currency: string;
  direction: string;
  occurred_at: string;
  created_at: string;
  created_by: string | null;
  notes: string | null;
  parent_type: string;
  parent_id: string;
  metadata: unknown;
  payment_id: string | null;
  invoice_id: string | null;
};

export type FinancialAllocationRow = {
  id: string;
  financial_event_id: string;
  amount: number | string;
  target_type: string;
  target_id: string;
  note: string | null;
  created_at?: string;
};

export function rowToEvent(row: FinancialEventRow): FinancialEvent {
  return {
    id: row.id,
    type: row.type as FinancialEventType,
    amount: Number(row.amount) || 0,
    currency: (row.currency as Currency) || "EGP",
    direction: row.direction as FinancialDirection,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
    ...(row.created_by ? { createdBy: row.created_by } : {}),
    ...(row.notes ? { notes: row.notes } : {}),
    parent: {
      parentType: row.parent_type as FinancialParentType,
      parentId: row.parent_id,
    },
    ...(row.metadata && typeof row.metadata === "object"
      ? { metadata: row.metadata as Record<string, unknown> }
      : {}),
    ...(row.payment_id ? { paymentId: row.payment_id } : {}),
    ...(row.invoice_id ? { invoiceId: row.invoice_id } : {}),
  };
}

export function eventToRow(e: FinancialEvent): Record<string, unknown> {
  return {
    id: e.id,
    type: e.type,
    amount: e.amount,
    currency: e.currency,
    direction: e.direction,
    occurred_at: e.occurredAt,
    created_at: e.createdAt,
    created_by: e.createdBy ?? null,
    notes: e.notes ?? null,
    parent_type: e.parent.parentType,
    parent_id: e.parent.parentId,
    metadata: e.metadata ?? {},
    payment_id: e.paymentId ?? null,
    invoice_id: e.invoiceId ?? null,
  };
}

export function rowToAllocation(
  row: FinancialAllocationRow
): FinancialAllocation {
  return {
    id: row.id,
    financialEventId: row.financial_event_id,
    amount: Number(row.amount) || 0,
    targetType: row.target_type as AllocationTargetType,
    targetId: row.target_id,
    ...(row.note ? { note: row.note } : {}),
  };
}

export function allocationToRow(
  a: FinancialAllocation
): Record<string, unknown> {
  return {
    id: a.id,
    financial_event_id: a.financialEventId,
    amount: a.amount,
    target_type: a.targetType,
    target_id: a.targetId,
    note: a.note ?? null,
  };
}
