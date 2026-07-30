"use server";

import { revalidatePath } from "next/cache";

import {
  actionError,
  sanitizeActionError,
  type DomainActionResult,
} from "@/lib/domain/types";
import {
  assertOrderAccess,
  requireFounderMutationAccess,
} from "@/lib/domain/mutation-auth";
import {
  createPayment,
  deletePayment,
  getPaymentById,
  refreshPayments,
  updatePayment,
} from "@/lib/payments/repository";
import type { Payment } from "@/lib/payments/types";
import { emitOrderClientPaymentAction } from "@/lib/integration/actions";

function revalidatePayments() {
  revalidatePath("/finance");
  revalidatePath("/orders");
  revalidatePath("/");
}

export async function createPaymentAction(
  input: Omit<Payment, "id"> & { id?: string }
): Promise<DomainActionResult<Payment>> {
  const gate = await assertOrderAccess(input.orderId, "payments.edit");
  if (!gate.ok) return actionError(gate.error);

  try {
    const payment = await createPayment(input);
    await refreshPayments();
    revalidatePayments();
    return { ok: true, data: payment };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}

export async function updatePaymentAction(
  paymentId: string,
  patch: Partial<Omit<Payment, "id">>
): Promise<DomainActionResult<Payment>> {
  const existing = getPaymentById(paymentId);
  const orderId = patch.orderId ?? existing?.orderId;
  if (!orderId) return actionError("Payment not found.");

  const gate = await requireFounderMutationAccess();
  if (!gate.ok) return actionError(gate.error);

  try {
    const payment = await updatePayment(paymentId, patch);
    await refreshPayments();
    revalidatePayments();
    return { ok: true, data: payment };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}

export async function deletePaymentAction(
  paymentId: string,
  _orderId: string
): Promise<DomainActionResult> {
  const gate = await requireFounderMutationAccess();
  if (!gate.ok) return actionError(gate.error);

  try {
    await deletePayment(paymentId);
    await refreshPayments();
    revalidatePayments();
    return { ok: true };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}

export type RecordOrderPaymentInput = {
  orderId: string;
  amount: number;
  kind: Payment["kind"];
  status: Payment["status"];
  method: NonNullable<Payment["method"]>;
  reference?: string;
  receiver?: string;
  note?: string;
  clientId: string;
  projectId?: string;
  workspaceId: string;
  label: string;
};

/** Create payment row and optionally emit finance event (Founder finance path). */
export async function recordOrderPaymentAction(
  input: RecordOrderPaymentInput
): Promise<DomainActionResult> {
  const gate = await assertOrderAccess(input.orderId, "payments.edit");
  if (!gate.ok) return actionError(gate.error);

  const value = input.amount;
  if (!Number.isFinite(value) || value <= 0) {
    return actionError("Invalid payment amount.");
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const payment = await createPayment({
      orderId: input.orderId,
      projectId: input.projectId ?? "",
      clientId: input.clientId,
      workspaceId: input.workspaceId,
      amount: value,
      currency: "EGP",
      kind: input.kind,
      status: input.status,
      paidAt: input.status === "paid" ? today : undefined,
      note: input.note?.trim() || undefined,
      label: input.label,
      method: input.method,
      reference: input.reference?.trim() || undefined,
      receiver: input.receiver?.trim() || undefined,
    });

    if (input.status === "paid" && input.kind !== "refund") {
      const emit = await emitOrderClientPaymentAction({
        orderId: input.orderId,
        amount: value,
        paymentId: payment.id,
        notes: input.note?.trim() || `Payment on order ${input.orderId}`,
      });
      if (!emit.ok) return emit;
    }

    await refreshPayments();
    revalidatePayments();
    return { ok: true };
  } catch (err) {
    return actionError(sanitizeActionError(err));
  }
}
