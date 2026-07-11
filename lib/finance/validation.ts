/**
 * Dedicated validators for Financial Event / Allocation create rules.
 * Append-only ledger — validation never mutates existing records.
 */

import {
  ALLOCATION_TARGET_TYPES,
  FINANCIAL_DIRECTIONS,
  FINANCIAL_EVENT_TYPES,
  FINANCIAL_PARENT_TYPES,
  directionForEventType,
} from "@/lib/finance/types";
import type {
  AllocationTargetType,
  Currency,
  FinancialDirection,
  FinancialEvent,
  FinancialEventType,
  FinancialParent,
  FinancialParentType,
  NewFinancialAllocationInput,
  NewFinancialEventInput,
} from "@/lib/finance/types";

export class FinanceValidationError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "FinanceValidationError";
    this.code = code;
  }
}

function isOneOf<T extends string>(value: string, allowed: readonly T[]): value is T {
  return (allowed as readonly string[]).includes(value);
}

export function assertPositiveAmount(amount: number, label: string): void {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new FinanceValidationError(
      "invalid_amount",
      `${label} must be a finite number greater than 0`
    );
  }
}

export function assertCurrency(currency: Currency | undefined): Currency {
  const value = currency ?? "EGP";
  if (value !== "EGP") {
    throw new FinanceValidationError(
      "invalid_currency",
      `Unsupported currency "${String(currency)}"; only EGP is allowed`
    );
  }
  return value;
}

export function assertParent(parent: FinancialParent | undefined): FinancialParent {
  if (!parent?.parentType || !parent?.parentId?.trim()) {
    throw new FinanceValidationError(
      "missing_parent",
      "Financial Event requires a parent { parentType, parentId }"
    );
  }
  if (!isOneOf(parent.parentType, FINANCIAL_PARENT_TYPES)) {
    throw new FinanceValidationError(
      "invalid_parent_type",
      `Invalid parentType "${parent.parentType}"`
    );
  }
  return {
    parentType: parent.parentType as FinancialParentType,
    parentId: parent.parentId.trim(),
  };
}

export function assertEventType(type: string): FinancialEventType {
  if (!isOneOf(type, FINANCIAL_EVENT_TYPES)) {
    throw new FinanceValidationError(
      "invalid_event_type",
      `Invalid Financial Event type "${type}"`
    );
  }
  return type;
}

export function resolveEventDirection(
  type: FinancialEventType,
  direction?: FinancialDirection
): FinancialDirection {
  const fromType = directionForEventType(type);
  const resolved = direction ?? fromType;
  if (!resolved) {
    throw new FinanceValidationError(
      "missing_direction",
      `direction is required for event type "${type}" (e.g. adjustment)`
    );
  }
  if (!isOneOf(resolved, FINANCIAL_DIRECTIONS)) {
    throw new FinanceValidationError(
      "invalid_direction",
      `Invalid direction "${resolved}"`
    );
  }
  if (fromType && direction && direction !== fromType) {
    throw new FinanceValidationError(
      "direction_mismatch",
      `direction for "${type}" must be "${fromType}", got "${direction}"`
    );
  }
  return resolved;
}

/** Validate create-event input; returns normalized fields for the repository. */
export function validateNewFinancialEvent(input: NewFinancialEventInput): {
  type: FinancialEventType;
  amount: number;
  currency: Currency;
  direction: FinancialDirection;
  parent: FinancialParent;
  occurredAt?: string;
  createdBy?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  paymentId?: string;
  invoiceId?: string;
} {
  const type = assertEventType(input.type);
  assertPositiveAmount(input.amount, "amount");
  const currency = assertCurrency(input.currency);
  const parent = assertParent(input.parent);
  const direction = resolveEventDirection(type, input.direction);

  if (input.occurredAt !== undefined && Number.isNaN(Date.parse(input.occurredAt))) {
    throw new FinanceValidationError(
      "invalid_occurred_at",
      "occurredAt must be a valid ISO date/time string"
    );
  }

  return {
    type,
    amount: input.amount,
    currency,
    direction,
    parent,
    occurredAt: input.occurredAt,
    createdBy: input.createdBy,
    notes: input.notes,
    metadata: input.metadata,
    paymentId: input.paymentId,
    invoiceId: input.invoiceId,
  };
}

export function assertAllocationTarget(
  targetType: string,
  targetId: string | undefined
): { targetType: AllocationTargetType; targetId: string } {
  if (!targetType || !targetId?.trim()) {
    throw new FinanceValidationError(
      "missing_allocation_target",
      "Allocation requires targetType and targetId"
    );
  }
  if (!isOneOf(targetType, ALLOCATION_TARGET_TYPES)) {
    throw new FinanceValidationError(
      "invalid_allocation_target_type",
      `Invalid allocation targetType "${targetType}"`
    );
  }
  return { targetType, targetId: targetId.trim() };
}

/**
 * Validate create-allocation input against the parent event and current allocated total.
 * Sum of allocations must not exceed the event amount.
 */
export function validateNewFinancialAllocation(
  input: NewFinancialAllocationInput,
  event: FinancialEvent | undefined,
  alreadyAllocated: number
): {
  financialEventId: string;
  amount: number;
  targetType: AllocationTargetType;
  targetId: string;
  note?: string;
} {
  assertPositiveAmount(input.amount, "allocation amount");
  const target = assertAllocationTarget(input.targetType, input.targetId);

  if (!input.financialEventId?.trim()) {
    throw new FinanceValidationError(
      "missing_financial_event_id",
      "Allocation requires financialEventId"
    );
  }

  if (!event) {
    throw new FinanceValidationError(
      "event_not_found",
      `Financial Event not found: ${input.financialEventId}`
    );
  }

  if (alreadyAllocated + input.amount > event.amount + Number.EPSILON) {
    throw new FinanceValidationError(
      "allocation_exceeds_event",
      `Allocations would exceed event amount (${alreadyAllocated + input.amount} > ${event.amount})`
    );
  }

  return {
    financialEventId: input.financialEventId,
    amount: input.amount,
    targetType: target.targetType,
    targetId: target.targetId,
    note: input.note,
  };
}
