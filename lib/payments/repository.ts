import { createPaymentsDb } from "@/lib/payments/db";
import {
  paymentToRow,
  rowToPayment,
  type PaymentRow,
} from "@/lib/payments/mappers";
import type { Payment } from "@/lib/payments/types";

let paymentsCache: Payment[] = [];

function upsertCache(p: Payment): void {
  paymentsCache = [p, ...paymentsCache.filter((x) => x.id !== p.id)];
}

export async function refreshPayments(): Promise<Payment[]> {
  const db = createPaymentsDb();
  const { data, error } = await db
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(`Failed to load payments: ${error.message}`);
  }
  paymentsCache = ((data ?? []) as PaymentRow[]).map(rowToPayment);
  return [...paymentsCache];
}

export function getPayments(): Payment[] {
  return [...paymentsCache];
}

export function getPaymentById(id: string): Payment | undefined {
  return paymentsCache.find((p) => p.id === id);
}

export function getPaymentsByOrder(orderId: string): Payment[] {
  return paymentsCache.filter((p) => p.orderId === orderId);
}

export function getPaymentsByProject(projectId: string): Payment[] {
  return paymentsCache.filter((p) => p.projectId === projectId);
}

export function getPaymentsByClient(clientId: string): Payment[] {
  return paymentsCache.filter((p) => p.clientId === clientId);
}

export function getPaidTotal(payments: Payment[]): number {
  return payments
    .filter((p) => p.status === "paid" && p.kind !== "refund")
    .reduce((acc, p) => acc + p.amount, 0);
}

export function getPendingTotal(payments: Payment[]): number {
  return payments
    .filter((p) => p.status === "pending")
    .reduce((acc, p) => acc + p.amount, 0);
}

function newPaymentId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `pay-${crypto.randomUUID()}`;
  }
  return `pay-${Date.now().toString(36)}`;
}

export async function createPayment(
  input: Omit<Payment, "id"> & { id?: string }
): Promise<Payment> {
  const payment: Payment = {
    ...input,
    id: input.id ?? newPaymentId(),
    currency: "EGP",
  };
  const db = createPaymentsDb();
  const { data, error } = await db
    .from("payments")
    .insert(paymentToRow(payment))
    .select("*")
    .single();
  if (error) {
    throw new Error(`Failed to create payment: ${error.message}`);
  }
  const saved = rowToPayment(data as PaymentRow);
  upsertCache(saved);
  return { ...saved };
}

export async function updatePayment(
  id: string,
  patch: Partial<Omit<Payment, "id">>
): Promise<Payment> {
  const existing = getPaymentById(id);
  if (!existing) throw new Error(`Payment not found: ${id}`);
  const merged: Payment = { ...existing, ...patch, id };
  const db = createPaymentsDb();
  const row = paymentToRow(merged);
  delete row.id;
  const { data, error } = await db
    .from("payments")
    .update(row)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    throw new Error(`Failed to update payment: ${error.message}`);
  }
  const saved = rowToPayment(data as PaymentRow);
  upsertCache(saved);
  return { ...saved };
}

export async function deletePayment(id: string): Promise<void> {
  const db = createPaymentsDb();
  const { error } = await db.from("payments").delete().eq("id", id);
  if (error) {
    throw new Error(`Failed to delete payment: ${error.message}`);
  }
  paymentsCache = paymentsCache.filter((p) => p.id !== id);
}

export function cachePayment(p: Payment): void {
  upsertCache(p);
}
