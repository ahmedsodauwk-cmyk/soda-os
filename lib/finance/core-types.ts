/**
 * Financial Core — transaction categories + order financial status vocabulary.
 * Ledger types stay in types.ts; categories live in event metadata.category.
 */

export const TRANSACTION_CATEGORIES = [
  "customer_payment",
  "customer_refund",
  "crew_payment",
  "supplier_payment",
  "equipment_purchase",
  "expense",
  "income",
  "transfer",
  "manual_adjustment",
  "opening_balance",
] as const;

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

export const ORDER_FINANCIAL_STATUSES = [
  "Agreed",
  "Collected",
  "Outstanding",
  "Refunded",
] as const;

export type OrderFinancialStatus = (typeof ORDER_FINANCIAL_STATUSES)[number];

export interface OrderFinancialSnapshot {
  orderId: string;
  agreed: number;
  collected: number;
  outstanding: number;
  refunded: number;
  status: OrderFinancialStatus;
}

export interface CompanyCashflowSnapshot {
  asOf: string;
  today: { income: number; expense: number; net: number };
  month: { income: number; expense: number; net: number; key: string };
  year: { income: number; expense: number; net: number; key: string };
  netProfitMonth: number;
  netProfitYear: number;
}

export interface AccountView {
  id: string;
  name: string;
  type: string;
  currency: "EGP";
  currentBalance: number;
  openingBalance: number;
  status: "active" | "inactive" | "frozen";
  createdAt: string;
  code: string;
  kind: "cash" | "bank" | "wallet";
}

export function isTransactionCategory(
  value: unknown
): value is TransactionCategory {
  return (
    typeof value === "string" &&
    (TRANSACTION_CATEGORIES as readonly string[]).includes(value)
  );
}
