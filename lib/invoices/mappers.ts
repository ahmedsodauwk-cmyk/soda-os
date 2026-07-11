import type {
  DeliveryStatus,
  Invoice,
  InvoiceStatus,
  OrderDelivery,
} from "@/lib/invoices/types";

export type InvoiceRow = {
  id: string;
  client_id: string;
  project_id: string | null;
  order_id: string | null;
  number: string;
  issue_date: string;
  due_date: string;
  amount: number | string;
  paid_amount: number | string;
  status: string;
  period_month: string;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};

export type DeliveryRow = {
  id: string;
  order_id: string;
  project_id: string;
  client_id: string;
  label: string;
  due_date: string;
  delivered_at: string | null;
  status: string;
  notes: string | null;
  created_at?: string;
};

export function rowToInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    clientId: row.client_id,
    ...(row.project_id ? { projectId: row.project_id } : {}),
    ...(row.order_id ? { orderId: row.order_id } : {}),
    number: row.number,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    amount: Number(row.amount) || 0,
    paidAmount: Number(row.paid_amount) || 0,
    status: row.status as InvoiceStatus,
    periodMonth: row.period_month,
    ...(row.notes ? { notes: row.notes } : {}),
  };
}

export function invoiceToRow(inv: Invoice): Record<string, unknown> {
  return {
    id: inv.id,
    client_id: inv.clientId,
    project_id: inv.projectId ?? null,
    order_id: inv.orderId ?? null,
    number: inv.number,
    issue_date: inv.issueDate,
    due_date: inv.dueDate,
    amount: inv.amount,
    paid_amount: inv.paidAmount,
    status: inv.status,
    period_month: inv.periodMonth,
    notes: inv.notes ?? null,
  };
}

export function rowToDelivery(row: DeliveryRow): OrderDelivery {
  return {
    id: row.id,
    orderId: row.order_id,
    projectId: row.project_id,
    clientId: row.client_id,
    label: row.label,
    dueDate: row.due_date,
    ...(row.delivered_at ? { deliveredAt: row.delivered_at } : {}),
    status: row.status as DeliveryStatus,
    ...(row.notes ? { notes: row.notes } : {}),
  };
}

export function deliveryToRow(d: OrderDelivery): Record<string, unknown> {
  return {
    id: d.id,
    order_id: d.orderId,
    project_id: d.projectId,
    client_id: d.clientId,
    label: d.label,
    due_date: d.dueDate,
    delivered_at: d.deliveredAt ?? null,
    status: d.status,
    notes: d.notes ?? null,
  };
}
