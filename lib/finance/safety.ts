/**
 * Financial safety — money is immutable.
 * Never delete/update ledger rows; only reverse / void / correct via new events.
 */

import { publishBusinessEvent } from "@/lib/core/publish";
import {
  createFinancialEvent,
  getFinancialEventById,
  listFinancialEvents,
} from "@/lib/finance/repository";
import type { FinancialEvent, NewFinancialEventInput } from "@/lib/finance/types";

export type FinancialSafetyAction = "reverse" | "void" | "correction";

function alreadyActioned(
  originalId: string,
  kind: "reversal" | "void" | "correction"
): FinancialEvent | undefined {
  return listFinancialEvents().find(
    (e) =>
      e.metadata?.safetyAction === kind &&
      e.metadata?.originalEventId === originalId
  );
}

async function publishSafetyEvent(
  action: FinancialSafetyAction,
  original: FinancialEvent,
  result: FinancialEvent,
  reason: string
): Promise<void> {
  const type =
    action === "reverse"
      ? "FinancialReversed"
      : action === "void"
        ? "FinancialVoided"
        : "FinancialCorrected";

  await publishBusinessEvent({
    type,
    source: `finance.safety.${action}`,
    payload: {
      entityId: result.id,
      entityType: "payment",
      paymentId: original.paymentId,
      orderId:
        original.parent.parentType === "order"
          ? original.parent.parentId
          : undefined,
      summary: `${action} of ${original.id}: ${reason}`,
      data: {
        action,
        originalEventId: original.id,
        newEventId: result.id,
        amount: original.amount,
        reason,
      },
    },
  });
}

/**
 * Reverse a financial event by posting an equal-and-opposite adjustment.
 * Original row is never mutated.
 */
export async function reverseFinancialEvent(input: {
  eventId: string;
  reason: string;
  createdBy?: string;
}): Promise<FinancialEvent> {
  const original = getFinancialEventById(input.eventId);
  if (!original) throw new Error(`Financial event not found: ${input.eventId}`);

  const existing = alreadyActioned(original.id, "reversal");
  if (existing) return { ...existing };

  const opposite =
    original.direction === "inflow" ? "outflow" : "inflow";

  const event = await createFinancialEvent({
    type: "adjustment",
    amount: original.amount,
    currency: original.currency,
    direction: opposite,
    createdBy: input.createdBy,
    notes: `REVERSAL: ${input.reason}`,
    parent: original.parent,
    paymentId: original.paymentId,
    invoiceId: original.invoiceId,
    metadata: {
      safetyAction: "reversal",
      originalEventId: original.id,
      reason: input.reason,
      kind: "financial_reversal",
    },
  });

  await publishSafetyEvent("reverse", original, event, input.reason);
  return event;
}

/**
 * Void a financial event — posts a neutralizing adjustment tagged as void.
 * Never deletes the original.
 */
export async function voidFinancialEvent(input: {
  eventId: string;
  reason: string;
  createdBy?: string;
}): Promise<FinancialEvent> {
  const original = getFinancialEventById(input.eventId);
  if (!original) throw new Error(`Financial event not found: ${input.eventId}`);

  const existing = alreadyActioned(original.id, "void");
  if (existing) return { ...existing };

  const opposite =
    original.direction === "inflow" ? "outflow" : "inflow";

  const event = await createFinancialEvent({
    type: "adjustment",
    amount: original.amount,
    currency: original.currency,
    direction: opposite,
    createdBy: input.createdBy,
    notes: `VOID: ${input.reason}`,
    parent: original.parent,
    paymentId: original.paymentId,
    invoiceId: original.invoiceId,
    metadata: {
      safetyAction: "void",
      originalEventId: original.id,
      reason: input.reason,
      kind: "financial_void",
      voided: true,
    },
  });

  await publishSafetyEvent("void", original, event, input.reason);
  return event;
}

/**
 * Correction — posts a new adjustment for the delta (positive = add inflow).
 */
export async function correctFinancialEvent(input: {
  eventId: string;
  correctionAmount: number;
  direction: "inflow" | "outflow";
  reason: string;
  createdBy?: string;
}): Promise<FinancialEvent> {
  const original = getFinancialEventById(input.eventId);
  if (!original) throw new Error(`Financial event not found: ${input.eventId}`);
  if (!Number.isFinite(input.correctionAmount) || input.correctionAmount <= 0) {
    throw new Error("correctionAmount must be > 0");
  }

  const draft: NewFinancialEventInput = {
    type: "adjustment",
    amount: input.correctionAmount,
    currency: original.currency,
    direction: input.direction,
    createdBy: input.createdBy,
    notes: `CORRECTION: ${input.reason}`,
    parent: original.parent,
    paymentId: original.paymentId,
    invoiceId: original.invoiceId,
    metadata: {
      safetyAction: "correction",
      originalEventId: original.id,
      reason: input.reason,
      kind: "financial_correction",
    },
  };

  const event = await createFinancialEvent(draft);
  await publishSafetyEvent("correction", original, event, input.reason);
  return event;
}

/** True if event has been reversed or voided. */
export function isFinancialEventNeutralized(eventId: string): boolean {
  return Boolean(
    alreadyActioned(eventId, "reversal") || alreadyActioned(eventId, "void")
  );
}
