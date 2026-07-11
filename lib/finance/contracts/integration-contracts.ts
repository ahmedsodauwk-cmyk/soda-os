/**
 * Integration contracts — how other modules will emit into / query Finance later.
 * Do NOT wire live integrations here. Types and function shapes only.
 */

import type {
  Currency,
  FinancialAllocation,
  FinancialEvent,
  FinancialParent,
  NewFinancialAllocationInput,
  NewFinancialEventInput,
} from "@/lib/finance/types";
import type {
  CashFlowFilter,
  CashFlowResult,
  ProjectFinanceResult,
} from "@/lib/finance/calculators";

/** Common emit result after a module records money movement into the ledger. */
export interface FinanceEmitResult {
  event: FinancialEvent;
  allocations: FinancialAllocation[];
}

/** Optional period / currency scope for finance queries. */
export interface FinanceQueryScope {
  currency?: Currency;
  from?: string;
  to?: string;
}

/* -------------------------------------------------------------------------- */
/* Orders                                                                     */
/* -------------------------------------------------------------------------- */

/** Orders → Finance: client money against an order. */
export interface OrderFinanceEmitContract {
  /** Record a client payment (deposit / installment / final) for an order. */
  emitOrderClientPayment(input: {
    orderId: string;
    amount: number;
    paymentId?: string;
    occurredAt?: string;
    notes?: string;
    /** Split across projects when one payment covers multiple. */
    projectAllocations?: Array<{ projectId: string; amount: number }>;
  }): FinanceEmitResult;

  /** Record a refund against an order. */
  emitOrderRefund(input: {
    orderId: string;
    amount: number;
    paymentId?: string;
    occurredAt?: string;
    notes?: string;
  }): FinanceEmitResult;
}

export interface OrderFinanceQueryContract {
  /** Ledger inflows parented to / allocated for this order. */
  getOrderRevenue(orderId: string, scope?: FinanceQueryScope): number;
  getOrderEvents(orderId: string): FinancialEvent[];
}

/* -------------------------------------------------------------------------- */
/* Projects                                                                   */
/* -------------------------------------------------------------------------- */

/** Projects never own wallets — only attribution via parent / allocations. */
export interface ProjectFinanceEmitContract {
  /** Expense attributed to a project (company still owns the cash). */
  emitProjectExpense(input: {
    projectId: string;
    amount: number;
    occurredAt?: string;
    notes?: string;
    parent?: FinancialParent;
  }): FinanceEmitResult;
}

export interface ProjectFinanceQueryContract {
  getProjectFinance(projectId: string, currency?: Currency): ProjectFinanceResult;
  getProjectRevenue(projectId: string, currency?: Currency): number;
  getProjectCost(projectId: string, currency?: Currency): number;
  getProjectProfit(projectId: string, currency?: Currency): number;
}

/* -------------------------------------------------------------------------- */
/* Crew / People                                                              */
/* -------------------------------------------------------------------------- */

/** Crew → Finance: payments to people from assignments (never manual ad-hoc). */
export interface CrewFinanceEmitContract {
  emitCrewPayment(input: {
    personId: string;
    amount: number;
    /** Prefer linking via assignment allocation target. */
    assignmentId?: string;
    orderId?: string;
    projectId?: string;
    occurredAt?: string;
    notes?: string;
  }): FinanceEmitResult;
}

export interface CrewFinanceQueryContract {
  /** Cash paid to person from the ledger. */
  getPersonPaid(personId: string, currency?: Currency): number;
  /**
   * Remaining owed: obligatedTotal (from assignments) − paid.
   * Caller supplies obligatedTotal until Assignments integrate.
   */
  getPersonBalance(
    personId: string,
    obligatedTotal?: number,
    currency?: Currency
  ): number;
  getPersonPaymentEvents(personId: string): FinancialEvent[];
}

/* -------------------------------------------------------------------------- */
/* Clients                                                                    */
/* -------------------------------------------------------------------------- */

export interface ClientFinanceEmitContract {
  /** Client-level payment when not yet tied to a single order. */
  emitClientPayment(input: {
    clientId: string;
    amount: number;
    paymentId?: string;
    occurredAt?: string;
    notes?: string;
    projectAllocations?: Array<{ projectId: string; amount: number }>;
  }): FinanceEmitResult;
}

export interface ClientFinanceQueryContract {
  getClientPaid(clientId: string, currency?: Currency): number;
  /**
   * Outstanding = obligatedTotal − paid.
   * obligatedTotal from Orders/Invoices until those modules integrate.
   */
  getClientOutstandingBalance(
    clientId: string,
    obligatedTotal: number,
    currency?: Currency
  ): number;
}

/* -------------------------------------------------------------------------- */
/* Quotations                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Quotations are commercial intent, not cash — deposit received may emit
 * a Financial Event parented to the quotation (then re-linked on convert).
 */
export interface QuotationFinanceEmitContract {
  emitQuotationDeposit(input: {
    quotationId: string;
    amount: number;
    paymentId?: string;
    clientId?: string;
    occurredAt?: string;
    notes?: string;
  }): FinanceEmitResult;
}

export interface QuotationFinanceQueryContract {
  getQuotationDepositTotal(quotationId: string, currency?: Currency): number;
  getQuotationEvents(quotationId: string): FinancialEvent[];
}

/* -------------------------------------------------------------------------- */
/* Payments (lib/payments actuals)                                            */
/* -------------------------------------------------------------------------- */

/**
 * Bridge: Payment records remain in lib/payments; Finance owns the ledger.
 * When a Payment becomes `paid`, Payments module will call emit.
 */
export interface PaymentFinanceEmitContract {
  /** Map a paid Payment into an immutable Financial Event (+ optional allocations). */
  emitFromPayment(input: {
    paymentId: string;
    orderId: string;
    clientId: string;
    projectId: string;
    amount: number;
    kind: "deposit" | "installment" | "final" | "refund";
    paidAt?: string;
    notes?: string;
  }): FinanceEmitResult;

  /** Attach further allocation slices to an existing payment-backed event. */
  allocatePaymentEvent(
    input: NewFinancialAllocationInput
  ): FinancialAllocation;
}

export interface PaymentFinanceQueryContract {
  getEventByPaymentId(paymentId: string): FinancialEvent | undefined;
  getUnallocatedForPayment(paymentId: string): number;
}

/* -------------------------------------------------------------------------- */
/* Company / Cash (shared query surface)                                      */
/* -------------------------------------------------------------------------- */

export interface CompanyFinanceQueryContract {
  getCompanyBalance(currency?: Currency): number;
  getCompanyCash(currency?: Currency): number;
  getCashFlow(filter?: CashFlowFilter): CashFlowResult;
}

/**
 * Aggregate contract map — implementers satisfy these later; Finance Core
 * already exposes the calculator/repository primitives behind them.
 */
export interface FinanceIntegrationContracts {
  orders: OrderFinanceEmitContract & OrderFinanceQueryContract;
  projects: ProjectFinanceEmitContract & ProjectFinanceQueryContract;
  crew: CrewFinanceEmitContract & CrewFinanceQueryContract;
  clients: ClientFinanceEmitContract & ClientFinanceQueryContract;
  quotations: QuotationFinanceEmitContract & QuotationFinanceQueryContract;
  payments: PaymentFinanceEmitContract & PaymentFinanceQueryContract;
  company: CompanyFinanceQueryContract;
}

/** Helper shape for building a NewFinancialEventInput from another module. */
export type FinanceEventDraft = NewFinancialEventInput;
