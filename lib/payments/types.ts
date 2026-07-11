import type { PaymentMethod } from "@/lib/wallets/types";

export type PaymentKind = "deposit" | "installment" | "final" | "refund";
export type PaymentStatus = "pending" | "paid" | "failed" | "waived" | "voided";
export type { PaymentMethod };

/**
 * Money movement against an Order.
 * Order.price / Order.deposit remain commercial terms; Payments are actuals.
 * Independent financial transaction — amount/date/method/reference/notes/receiver.
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
  /** Cash | Bank | Instapay | Vodafone Cash */
  method?: PaymentMethod;
  /** External reference (transfer id, receipt no.) */
  reference?: string;
  /** Who received the payment */
  receiver?: string;
}
