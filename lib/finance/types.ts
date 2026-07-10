/**
 * Finance foundation — types only.
 * Payment actuals live in lib/payments; this module will own ledgers,
 * invoices, and studio P&L views in a later sprint.
 */
export type InvoiceStatus = "draft" | "sent" | "partial" | "paid" | "void";

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
