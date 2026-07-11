import type { Payment, PaymentKind, PaymentStatus } from "@/lib/payments/types";

export type PaymentRow = {
  id: string;
  order_id: string;
  project_id: string;
  client_id: string;
  workspace_id: string;
  amount: number | string;
  currency: string;
  kind: string;
  status: string;
  paid_at: string | null;
  note: string | null;
  label: string | null;
  created_at?: string;
};

export function rowToPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    orderId: row.order_id,
    projectId: row.project_id,
    clientId: row.client_id,
    workspaceId: row.workspace_id,
    amount: Number(row.amount) || 0,
    currency: "EGP",
    kind: row.kind as PaymentKind,
    status: row.status as PaymentStatus,
    ...(row.paid_at ? { paidAt: row.paid_at } : {}),
    ...(row.note ? { note: row.note } : {}),
    ...(row.label ? { label: row.label } : {}),
  };
}

export function paymentToRow(p: Payment): Record<string, unknown> {
  return {
    id: p.id,
    order_id: p.orderId,
    project_id: p.projectId,
    client_id: p.clientId,
    workspace_id: p.workspaceId,
    amount: p.amount,
    currency: p.currency,
    kind: p.kind,
    status: p.status,
    paid_at: p.paidAt ?? null,
    note: p.note ?? null,
    label: p.label ?? null,
  };
}
