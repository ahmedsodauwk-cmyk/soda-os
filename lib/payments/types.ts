export type PaymentKind = "deposit" | "installment" | "final" | "refund";
export type PaymentStatus = "pending" | "paid" | "failed" | "waived";

/**
 * Money movement against an Order.
 * Order.price / Order.deposit remain commercial terms; Payments are actuals.
 */
export interface Payment {
  id: string;
  orderId: string;
  projectId: string;
  clientId: string;
  workspaceId: string;
  amount: number;
  currency: "EGP";
  kind: PaymentKind;
  status: PaymentStatus;
  paidAt?: string;
  note?: string;
  label?: string;
}
