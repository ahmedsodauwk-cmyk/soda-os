/**
 * Financial Engine — domain types.
 *
 * Events are immutable money movements owned by the company.
 * Projects never hold wallets; they appear only as parents or allocation targets.
 * Payment actuals still live in lib/payments; invoices in lib/invoices.
 * This module owns the ledger of Financial Events + Allocations.
 */

export type Currency = "EGP";

/** Media-production money movements — not a full accounting chart of accounts. */
export const FINANCIAL_EVENT_TYPES = [
  "client_payment",
  "crew_payment",
  "expense",
  "refund",
  "adjustment",
] as const;

export type FinancialEventType = (typeof FINANCIAL_EVENT_TYPES)[number];

export const FINANCIAL_DIRECTIONS = ["inflow", "outflow"] as const;

export type FinancialDirection = (typeof FINANCIAL_DIRECTIONS)[number];

/** Required single parent for every Financial Event. */
export const FINANCIAL_PARENT_TYPES = [
  "order",
  "project",
  "client",
  "crew",
  "quotation",
  "invoice",
  "company",
  "allocation_target",
] as const;

export type FinancialParentType = (typeof FINANCIAL_PARENT_TYPES)[number];

export interface FinancialParent {
  parentType: FinancialParentType;
  parentId: string;
}

/**
 * Immutable ledger entry. Once created, never updated or deleted.
 * Company owns the money; parent links the event to a business entity.
 */
export interface FinancialEvent {
  id: string;
  type: FinancialEventType;
  amount: number;
  currency: Currency;
  direction: FinancialDirection;
  occurredAt: string;
  createdAt: string;
  createdBy?: string;
  notes?: string;
  /** Required — every event has exactly one parent. */
  parent: FinancialParent;
  metadata?: Record<string, unknown>;
  /** Optional links to existing payment / invoice records. */
  paymentId?: string;
  invoiceId?: string;
}

/** Where an allocation slice of an event is attributed (not a wallet owner). */
export const ALLOCATION_TARGET_TYPES = [
  "project",
  "order",
  "crew_assignment",
  "invoice_line",
  "expense_category",
  "company",
] as const;

export type AllocationTargetType = (typeof ALLOCATION_TARGET_TYPES)[number];

/**
 * Split of a Financial Event across attribution targets.
 * Sum of allocations for an event must not exceed the event amount.
 */
export interface FinancialAllocation {
  id: string;
  financialEventId: string;
  amount: number;
  targetType: AllocationTargetType;
  targetId: string;
  note?: string;
}

/**
 * Company-level money position. Projects do NOT have wallets —
 * balance is always computed at company scope from events.
 */
export interface CompanyWallet {
  currency: Currency;
  balance: number;
  totalInflow: number;
  totalOutflow: number;
  eventCount: number;
}

export type InvoiceStatus = "draft" | "sent" | "partial" | "paid" | "void";

/** Legacy stub invoice shape kept for getInvoices() compatibility. */
export interface Invoice {
  id: string;
  orderId: string;
  projectId: string;
  clientId: string;
  workspaceId: string;
  amount: number;
  currency: "EGP";
  status: InvoiceStatus;
  issuedAt?: string;
  dueAt?: string;
  note?: string;
}

export interface FinanceSummary {
  revenuePaid: number;
  revenuePending: number;
  outstandingBalance: number;
  currency: "EGP";
}

/** Input for append-only event creation (id / createdAt assigned by repository). */
export interface NewFinancialEventInput {
  type: FinancialEventType;
  amount: number;
  currency?: Currency;
  /** Required for `adjustment`; otherwise derived from type. */
  direction?: FinancialDirection;
  occurredAt?: string;
  createdBy?: string;
  notes?: string;
  parent: FinancialParent;
  metadata?: Record<string, unknown>;
  paymentId?: string;
  invoiceId?: string;
}

export interface NewFinancialAllocationInput {
  financialEventId: string;
  amount: number;
  targetType: AllocationTargetType;
  targetId: string;
  note?: string;
}

export interface ListFinancialEventsFilter {
  parentType?: FinancialParentType;
  parentId?: string;
  type?: FinancialEventType;
  direction?: FinancialDirection;
  /** Inclusive ISO date/time lower bound on occurredAt. */
  from?: string;
  /** Inclusive ISO date/time upper bound on occurredAt. */
  to?: string;
  paymentId?: string;
  invoiceId?: string;
}

/** Default direction for each event type (adjustment must be explicit). */
export function directionForEventType(
  type: FinancialEventType
): FinancialDirection | undefined {
  switch (type) {
    case "client_payment":
      return "inflow";
    case "crew_payment":
    case "expense":
    case "refund":
      return "outflow";
    case "adjustment":
      return undefined;
  }
}
