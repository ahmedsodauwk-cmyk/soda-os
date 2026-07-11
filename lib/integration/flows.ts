/**
 * OS orchestration — quotation → order → project → crew → finance.
 * Reuses existing module write paths; does not duplicate business rules.
 */

import {
  assignmentFinalAmount,
  assignmentRemaining,
  createAssignment,
  getAssignmentById,
  updateAssignmentPayment,
  type NewAssignmentInput,
  type OrderAssignment,
} from "@/lib/assignments/repository";
import { ensureOrderProjectLink } from "@/lib/business/link-order";
import type { FinanceEmitResult } from "@/lib/finance/contracts/integration-contracts";
import {
  createAllocation,
  createFinancialEvent,
  listFinancialEvents,
} from "@/lib/finance/repository";
import type { Currency, FinancialEvent } from "@/lib/finance/types";
import type { JourneyStage } from "@/lib/journey/types";
import {
  fetchOrderById,
  getOrderById,
  updateOrder,
} from "@/lib/orders/repository";
import type { NewOrderInput, Order } from "@/lib/orders/types";
import { updateProject } from "@/lib/projects/repository";
import type { Project } from "@/lib/projects/types";
import { convertQuotationToProject } from "@/lib/quotations/convert";
import { getQuotationById } from "@/lib/quotations/repository";
import type { QuotationConversionResult } from "@/lib/quotations/types";
import { computeQuotationTotals } from "@/lib/quotations/utils";

const DEFAULT_CURRENCY: Currency = "EGP";

function depositFromQuotation(
  quotationId: string,
  fallbackDeposit: number
): number {
  const q = getQuotationById(quotationId);
  if (!q) return fallbackDeposit;
  const depositPlan = q.paymentPlan.find((p) =>
    p.label.toLowerCase().includes("deposit")
  );
  if (depositPlan && depositPlan.amount > 0) return depositPlan.amount;
  const totals = computeQuotationTotals(q);
  const total = totals.total > 0 ? totals.total : q.estimatedValue || 0;
  return fallbackDeposit > 0 ? fallbackDeposit : Math.round(total * 0.4);
}

/** Quotation deposit → ledger (parent: quotation). Idempotent per paymentId. */
export async function emitQuotationDeposit(input: {
  quotationId: string;
  amount: number;
  paymentId?: string;
  clientId?: string;
  projectId?: string;
  orderId?: string;
  occurredAt?: string;
  notes?: string;
  createdBy?: string;
}): Promise<FinanceEmitResult> {
  if (input.paymentId) {
    const existing = listFinancialEvents({ paymentId: input.paymentId }).find(
      (e) => e.type === "client_payment"
    );
    if (existing) {
      return { event: existing, allocations: [] };
    }
  }

  const event = await createFinancialEvent({
    type: "client_payment",
    amount: input.amount,
    currency: DEFAULT_CURRENCY,
    occurredAt: input.occurredAt,
    createdBy: input.createdBy,
    notes: input.notes ?? `Deposit for quotation ${input.quotationId}`,
    parent: { parentType: "quotation", parentId: input.quotationId },
    paymentId: input.paymentId,
    metadata: {
      clientId: input.clientId,
      projectId: input.projectId,
      orderId: input.orderId,
      kind: "deposit",
    },
  });

  const allocations = [];
  if (input.projectId) {
    allocations.push(
      await createAllocation({
        financialEventId: event.id,
        amount: input.amount,
        targetType: "project",
        targetId: input.projectId,
        note: "Deposit attributed to project on convert",
      })
    );
  } else if (input.orderId) {
    allocations.push(
      await createAllocation({
        financialEventId: event.id,
        amount: input.amount,
        targetType: "order",
        targetId: input.orderId,
        note: "Deposit attributed to order",
      })
    );
  }

  return { event, allocations };
}

/** Client payment against an order (+ optional project allocation). */
export async function emitOrderClientPayment(input: {
  orderId: string;
  amount: number;
  paymentId?: string;
  occurredAt?: string;
  notes?: string;
  createdBy?: string;
  projectAllocations?: Array<{ projectId: string; amount: number }>;
}): Promise<FinanceEmitResult> {
  if (input.paymentId) {
    const existing = listFinancialEvents({ paymentId: input.paymentId }).find(
      (e) => e.type === "client_payment"
    );
    if (existing) {
      return { event: existing, allocations: [] };
    }
  }

  const order = getOrderById(input.orderId);
  const event = await createFinancialEvent({
    type: "client_payment",
    amount: input.amount,
    currency: DEFAULT_CURRENCY,
    occurredAt: input.occurredAt,
    createdBy: input.createdBy,
    notes: input.notes,
    parent: { parentType: "order", parentId: input.orderId },
    paymentId: input.paymentId,
    metadata: {
      clientId: order?.clientId,
      projectId: order?.projectId,
    },
  });

  const allocations = [];
  for (const slice of input.projectAllocations ?? []) {
    allocations.push(
      await createAllocation({
        financialEventId: event.id,
        amount: slice.amount,
        targetType: "project",
        targetId: slice.projectId,
      })
    );
  }

  if (
    allocations.length === 0 &&
    order?.projectId &&
    input.amount > 0
  ) {
    allocations.push(
      await createAllocation({
        financialEventId: event.id,
        amount: input.amount,
        targetType: "project",
        targetId: order.projectId,
      })
    );
  }

  return { event, allocations };
}

/**
 * Crew payment — single write path:
 * ledger event + assignment allocation + assignment.paidAmount.
 */
export async function emitCrewPayment(input: {
  personId: string;
  amount: number;
  assignmentId?: string;
  orderId?: string;
  projectId?: string;
  occurredAt?: string;
  notes?: string;
  createdBy?: string;
}): Promise<FinanceEmitResult> {
  const event = await createFinancialEvent({
    type: "crew_payment",
    amount: input.amount,
    currency: DEFAULT_CURRENCY,
    occurredAt: input.occurredAt,
    createdBy: input.createdBy,
    notes: input.notes,
    parent: { parentType: "crew", parentId: input.personId },
    metadata: {
      assignmentId: input.assignmentId,
      orderId: input.orderId,
      projectId: input.projectId,
    },
  });

  const allocations = [];
  if (input.assignmentId) {
    allocations.push(
      await createAllocation({
        financialEventId: event.id,
        amount: input.amount,
        targetType: "crew_assignment",
        targetId: input.assignmentId,
        note: input.notes,
      })
    );
  } else if (input.projectId) {
    allocations.push(
      await createAllocation({
        financialEventId: event.id,
        amount: input.amount,
        targetType: "project",
        targetId: input.projectId,
        note: "Crew cost attributed to project",
      })
    );
  }

  return { event, allocations };
}

export interface QuotationConversionFlowResult extends QuotationConversionResult {
  financialEvent?: FinancialEvent;
}

/**
 * Quotation → Client → Project → Order → Invoice → Payment → Finance deposit.
 * Wraps convertQuotationToProject (which already emits deposit); re-links
 * idempotently when callers need the FinanceEmitResult shape.
 */
export async function runQuotationConversionFlow(
  quotationId: string,
  options?: { editedBy?: string; force?: boolean; emitDeposit?: boolean }
): Promise<QuotationConversionFlowResult> {
  const result = await convertQuotationToProject(quotationId, options);
  const emitDeposit = options?.emitDeposit !== false;

  if (!emitDeposit || !result.paymentId) {
    return result;
  }

  const paymentAmount = depositFromQuotation(quotationId, 0);
  if (paymentAmount <= 0 && !result.financialEventId) {
    return result;
  }

  const amount =
    paymentAmount > 0
      ? paymentAmount
      : (() => {
          const q = getQuotationById(quotationId);
          if (!q) return 0;
          const totals = computeQuotationTotals(q);
          const total = totals.total > 0 ? totals.total : q.estimatedValue || 0;
          return Math.round(total * 0.4);
        })();

  if (amount <= 0) return result;

  const { event } = await emitQuotationDeposit({
    quotationId: result.quotationId,
    amount,
    paymentId: result.paymentId,
    clientId: result.clientId,
    projectId: result.projectId,
    orderId: result.orderId,
    createdBy: options?.editedBy,
    notes: `Deposit on convert ${result.quotationId} → ${result.projectId}`,
  });

  return { ...result, financialEvent: event, financialEventId: event.id };
}

/** Order → ensure Project (+ client/workspace) link. */
export async function linkOrderToProject(
  orderId: string,
  input: NewOrderInput
): Promise<Pick<Order, "projectId" | "clientId" | "workspaceId">> {
  return ensureOrderProjectLink(orderId, input);
}

/** Project/Order → assign crew (creates OrderAssignment). */
export async function assignCrewToOrder(
  input: NewAssignmentInput
): Promise<OrderAssignment> {
  const order = getOrderById(input.orderId) ?? (await fetchOrderById(input.orderId));
  if (!order) {
    throw new Error(`Order not found: ${input.orderId}`);
  }
  return createAssignment(input);
}

export interface PayCrewAssignmentResult {
  assignment: OrderAssignment;
  finance: FinanceEmitResult;
}

/**
 * Pay against an assignment — updates paidAmount and emits crew_payment.
 * Amount defaults to remaining balance.
 */
export async function payCrewAssignment(input: {
  assignmentId: string;
  amount?: number;
  occurredAt?: string;
  notes?: string;
  createdBy?: string;
}): Promise<PayCrewAssignmentResult> {
  const assignment = getAssignmentById(input.assignmentId);
  if (!assignment) {
    throw new Error(`Assignment not found: ${input.assignmentId}`);
  }

  const remaining = assignmentRemaining(assignment);
  const amount = input.amount ?? remaining;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Payment amount must be a finite number greater than 0");
  }
  if (amount > remaining) {
    throw new Error(
      `Payment ${amount} exceeds remaining ${remaining} on assignment ${assignment.id}`
    );
  }

  const order = getOrderById(assignment.orderId);
  const finance = await emitCrewPayment({
    personId: assignment.personId,
    amount,
    assignmentId: assignment.id,
    orderId: assignment.orderId,
    projectId: order?.projectId,
    occurredAt: input.occurredAt,
    notes: input.notes,
    createdBy: input.createdBy,
  });

  const updated = await updateAssignmentPayment(assignment.id, {
    paidAmount: assignment.paidAmount + amount,
    paidAt: input.occurredAt ?? new Date().toISOString().slice(0, 10),
  });

  if (!updated) {
    throw new Error(`Failed to update assignment ${assignment.id}`);
  }

  return { assignment: updated, finance };
}

/**
 * Mark shoot complete: order Shooting → Editing, project journey → Editing.
 * Also accepts Scheduled (treat as shoot done) so operators can advance from hub.
 */
export async function markShootComplete(orderId: string): Promise<{
  order: Order;
  projectId: string;
}> {
  const order = getOrderById(orderId) ?? (await fetchOrderById(orderId));
  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }
  if (
    order.status === "Cancelled" ||
    order.status === "Delivered" ||
    order.status === "Completed"
  ) {
    throw new Error(
      `Cannot mark shoot complete for order in status ${order.status}`
    );
  }
  if (order.status === "Holding" || order.status === "Pending") {
    throw new Error(
      `Confirm the order before marking shoot complete (status ${order.status})`
    );
  }
  const updated = await updateOrder(orderId, { status: "Editing" });
  if (order.projectId) {
    await updateProject(order.projectId, {
      journeyStage: "Editing",
      status: "Active",
    });
  }
  return { order: updated, projectId: order.projectId };
}

/** Project finished: status Completed + journey Closed. */
export async function finishProject(projectId: string): Promise<Project> {
  return updateProject(projectId, {
    status: "Completed",
    journeyStage: "Closed",
    progress: 100,
  });
}

/**
 * After delivery/invoice/payment writes, keep journey stage in sync when advancing.
 */
export async function advanceProjectJourney(
  projectId: string,
  stage: JourneyStage
): Promise<Project> {
  return updateProject(projectId, { journeyStage: stage });
}

export {
  assignmentFinalAmount,
  assignmentRemaining,
};
