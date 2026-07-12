/**
 * Order financial status — Agreed / Collected / Outstanding / Refunded.
 * Revenue = collected money ONLY. Agreed Price ≠ Revenue.
 * Outstanding = Agreed − Collected.
 * Profit cannot exist before expenses AND collections.
 */

import { getAssignmentsByOrder } from "@/lib/assignments/repository";
import { assignmentFinalAmount } from "@/lib/assignments/types";
import { listExpenses } from "@/lib/finance/expenses";
import type {
  OrderFinancialSnapshot,
  OrderFinancialStatus,
} from "@/lib/finance/core-types";
import { getOrders } from "@/lib/orders/repository";
import { isOrderBillable } from "@/lib/orders/status";
import { getPayments } from "@/lib/payments/repository";

export type OrderPaymentAttention =
  | "clear"
  | "waiting_payment"
  | "unpaid_overdue";

export function getOrderFinancialSnapshot(
  orderId: string
): OrderFinancialSnapshot | undefined {
  const order = getOrders().find((o) => o.id === orderId);
  if (!order) return undefined;

  const payments = getPayments().filter((p) => p.orderId === orderId);
  const collected = payments
    .filter((p) => p.status === "paid" && p.kind !== "refund")
    .reduce((acc, p) => acc + p.amount, 0);
  const refunded = payments
    .filter((p) => p.status === "paid" && p.kind === "refund")
    .reduce((acc, p) => acc + p.amount, 0);

  const agreed = isOrderBillable(order.status) ? order.price : order.price;
  const netCollected = Math.max(0, collected - refunded);
  /** Outstanding = Agreed − Collected (never negative). */
  const outstanding = Math.max(0, agreed - netCollected);

  let status: OrderFinancialStatus;
  if (refunded > 0 && netCollected <= 0 && collected > 0) {
    status = "Refunded";
  } else if (outstanding <= 0.009 && agreed > 0) {
    status = "Collected";
  } else if (netCollected > 0) {
    status = "Outstanding";
  } else {
    status = "Agreed";
  }

  const orderExpenses = listExpenses().filter(
    (e) => e.orderId === orderId && e.status === "posted"
  );
  const expenseTotal = orderExpenses.reduce((acc, e) => acc + e.amount, 0);
  const crewCost = getAssignmentsByOrder(orderId).reduce(
    (acc, a) => acc + assignmentFinalAmount(a),
    0
  );
  const totalCosts = expenseTotal + crewCost;

  /**
   * Profit only when both collections and expenses exist.
   * Agreed price alone never creates profit.
   */
  const hasCollections = netCollected > 0;
  const hasExpenses = totalCosts > 0 || orderExpenses.length > 0;
  const profit =
    hasCollections && hasExpenses ? netCollected - totalCosts : null;

  return {
    orderId,
    agreed,
    collected: netCollected,
    /** Alias: revenue is collected cash only */
    revenue: netCollected,
    outstanding,
    refunded,
    expenseTotal,
    crewCost,
    profit,
    status,
  };
}

/**
 * Label outstanding balances relative to delivery due date.
 * Before due → Waiting Payment; after due → Unpaid.
 */
export function getOrderPaymentAttention(
  orderId: string,
  asOf: string
): OrderPaymentAttention {
  const snap = getOrderFinancialSnapshot(orderId);
  const order = getOrders().find((o) => o.id === orderId);
  if (!snap || !order || snap.outstanding <= 0.009) return "clear";
  const due = order.deliveryDate || order.shootDate;
  if (due && due < asOf) return "unpaid_overdue";
  return "waiting_payment";
}

export function listOrderFinancialSnapshots(): OrderFinancialSnapshot[] {
  return getOrders()
    .filter((o) => o.status !== "Cancelled")
    .map((o) => getOrderFinancialSnapshot(o.id)!)
    .filter(Boolean);
}

export function getOrderFinancialStatus(
  orderId: string
): OrderFinancialStatus | undefined {
  return getOrderFinancialSnapshot(orderId)?.status;
}
