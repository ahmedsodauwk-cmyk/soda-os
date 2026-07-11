/**
 * Order financial status — Agreed / Collected / Outstanding / Refunded.
 * Derived from order price + payments; never stored as mutable cash.
 */

import { getOrders } from "@/lib/orders/repository";
import { isOrderBillable } from "@/lib/orders/status";
import { getPayments } from "@/lib/payments/repository";
import type {
  OrderFinancialSnapshot,
  OrderFinancialStatus,
} from "@/lib/finance/core-types";

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

  return {
    orderId,
    agreed,
    collected: netCollected,
    outstanding,
    refunded,
    status,
  };
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
