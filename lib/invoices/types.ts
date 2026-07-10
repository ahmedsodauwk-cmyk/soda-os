/**
 * Commercial deliveries + invoices (client-facing money trail).
 */

export const INVOICE_STATUSES = [
  "draft",
  "sent",
  "partial",
  "paid",
  "overdue",
  "void",
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const DELIVERY_STATUSES = [
  "pending",
  "in_progress",
  "delivered",
  "accepted",
] as const;

export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export interface OrderDelivery {
  id: string;
  orderId: string;
  projectId: string;
  clientId: string;
  label: string;
  dueDate: string;
  deliveredAt?: string;
  status: DeliveryStatus;
  notes?: string;
}

export interface Invoice {
  id: string;
  clientId: string;
  projectId?: string;
  orderId?: string;
  number: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: InvoiceStatus;
  /** YYYY-MM for monthly account grouping */
  periodMonth: string;
  notes?: string;
}

export function invoiceOutstanding(inv: Invoice): number {
  if (inv.status === "void") return 0;
  return Math.max(0, inv.amount - inv.paidAmount);
}
