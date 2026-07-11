import { publishBusinessEvent } from "@/lib/core/publish";
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
  const fullRow = paymentToRow(payment);
  let { data, error } = await db
    .from("payments")
    .insert(fullRow)
    .select("*")
    .single();

  // Migration may not have method/reference/receiver yet — retry without them
  if (
    error &&
    (error.message.includes("method") ||
      error.message.includes("reference") ||
      error.message.includes("receiver") ||
      error.message.includes("schema cache"))
  ) {
    const legacy = { ...fullRow };
    delete legacy.method;
    delete legacy.reference;
    delete legacy.receiver;
    const retry = await db.from("payments").insert(legacy).select("*").single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    throw new Error(`Failed to create payment: ${error.message}`);
  }
  const saved = {
    ...rowToPayment(data as PaymentRow),
    method: payment.method ?? rowToPayment(data as PaymentRow).method,
    reference: payment.reference ?? rowToPayment(data as PaymentRow).reference,
    receiver: payment.receiver ?? rowToPayment(data as PaymentRow).receiver,
  };
  upsertCache(saved);
  if (saved.status === "paid" || saved.kind === "deposit") {
    await publishBusinessEvent({
      type: "PaymentReceived",
      source: "payments.repository.createPayment",
      payload: {
        entityId: saved.id,
        entityType: "payment",
        paymentId: saved.id,
        clientId: saved.clientId,
        projectId: saved.projectId,
        orderId: saved.orderId,
        summary: `Payment ${saved.amount} ${saved.currency ?? "EGP"} (${saved.kind})`,
        data: {
          amount: saved.amount,
          kind: saved.kind,
          status: saved.status,
          method: saved.method ?? "cash",
          reference: saved.reference,
          receiver: saved.receiver,
          paidAt: saved.paidAt,
          note: saved.note,
        },
      },
    });
  } else {
    await publishBusinessEvent({
      type: "PaymentUpdated",
      source: "payments.repository.createPayment",
      payload: {
        entityId: saved.id,
        entityType: "payment",
        paymentId: saved.id,
        clientId: saved.clientId,
        projectId: saved.projectId,
        orderId: saved.orderId,
        summary: `Payment recorded: ${saved.id}`,
        data: {
          amount: saved.amount,
          status: saved.status,
          method: saved.method,
        },
      },
    });
  }
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
  const becamePaid =
    patch.status === "paid" ||
    (saved.status === "paid" && existing.status !== "paid");
  await publishBusinessEvent({
    type: becamePaid ? "PaymentReceived" : "PaymentUpdated",
    source: "payments.repository.updatePayment",
    payload: {
      entityId: saved.id,
      entityType: "payment",
      paymentId: saved.id,
      clientId: saved.clientId,
      projectId: saved.projectId,
      orderId: saved.orderId,
      summary: becamePaid
        ? `Payment received: ${saved.amount}`
        : `Payment updated: ${saved.id}`,
      data: {
        amount: saved.amount,
        status: saved.status,
        method: saved.method ?? "cash",
        reference: saved.reference,
        receiver: saved.receiver,
        paidAt: saved.paidAt,
        note: saved.note,
      },
    },
  });
  return { ...saved };
}

/**
 * Financial safety: payments are never hard-deleted.
 * Void marks status=voided and publishes PaymentUpdated for audit/rules.
 */
export async function deletePayment(id: string): Promise<void> {
  await voidPayment(id, "Payment voided (delete blocked by financial safety)");
}

/** Void a payment record — immutable money path. */
export async function voidPayment(
  id: string,
  reason = "Voided by operator"
): Promise<Payment> {
  const existing = getPaymentById(id);
  if (!existing) throw new Error(`Payment not found: ${id}`);
  if (existing.status === "voided") return { ...existing };

  const db = createPaymentsDb();
  const { data, error } = await db
    .from("payments")
    .update({
      status: "voided",
      note: [existing.note, `VOID: ${reason}`].filter(Boolean).join(" · "),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    // Fallback when voided status not in CHECK yet — soft-mark via note + failed
    const { data: fallback, error: fbErr } = await db
      .from("payments")
      .update({
        status: "failed",
        note: [existing.note, `VOID: ${reason}`].filter(Boolean).join(" · "),
      })
      .eq("id", id)
      .select("*")
      .single();
    if (fbErr) {
      throw new Error(`Failed to void payment: ${error.message}`);
    }
    const saved = rowToPayment(fallback as PaymentRow);
    upsertCache(saved);
    await publishBusinessEvent({
      type: "PaymentUpdated",
      source: "payments.repository.voidPayment",
      payload: {
        entityId: saved.id,
        entityType: "payment",
        paymentId: saved.id,
        clientId: saved.clientId,
        projectId: saved.projectId,
        orderId: saved.orderId,
        summary: `Payment voided: ${saved.id} — ${reason}`,
        data: { voided: true, reason, amount: saved.amount },
      },
    });
    return { ...saved };
  }

  const saved = rowToPayment(data as PaymentRow);
  upsertCache(saved);
  await publishBusinessEvent({
    type: "PaymentUpdated",
    source: "payments.repository.voidPayment",
    payload: {
      entityId: saved.id,
      entityType: "payment",
      paymentId: saved.id,
      clientId: saved.clientId,
      projectId: saved.projectId,
      orderId: saved.orderId,
      summary: `Payment voided: ${saved.id} — ${reason}`,
      data: { voided: true, reason, amount: saved.amount },
    },
  });
  return { ...saved };
}

export function cachePayment(p: Payment): void {
  upsertCache(p);
}
