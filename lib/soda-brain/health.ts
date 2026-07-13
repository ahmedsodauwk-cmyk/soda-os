/**
 * SODA Brain (internal) — health verdict signals.
 * Called only via evaluateOrderOperationalTruth — do not import from UI.
 * Thin composition over existing finance / status / assignment signals.
 */

import {
  assignmentRemaining,
  type OrderAssignment,
} from "@/lib/assignments/types";
import type { OrderDelivery } from "@/lib/invoices/types";
import {
  isOrderActiveWorkload,
  isOrderCompleted,
  isOrderHolding,
} from "@/lib/orders/status";
import type { Order } from "@/lib/orders/types";

export type OrderHealthLevel = "healthy" | "watch" | "at_risk" | "critical";

export interface OrderHealthVerdict {
  level: OrderHealthLevel;
  /** One-line founder-facing verdict */
  label: string;
  /** Short reason — worst true signal */
  reason: string;
}

export interface OrderHealthInput {
  order: Order;
  finance: {
    agreed: number;
    collected: number;
    outstanding: number;
    status: string;
  };
  assignments: OrderAssignment[];
  deliveries: OrderDelivery[];
  expenseCount: number;
  fileCount: number;
  /** YYYY-MM-DD studio today */
  asOf: string;
}

/** Mirrors `getOrderPaymentAttention` using already-loaded finance — no repo reads. */
function paymentAttentionFrom(
  outstanding: number,
  order: Order,
  asOf: string
): "clear" | "waiting_payment" | "unpaid_overdue" {
  if (outstanding <= 0.009) return "clear";
  const due = order.deliveryDate || order.shootDate;
  if (due && due < asOf) return "unpaid_overdue";
  return "waiting_payment";
}

function daysUntil(date: string, asOf: string): number | null {
  if (!date) return null;
  const a = Date.parse(`${asOf}T12:00:00`);
  const b = Date.parse(`${date}T12:00:00`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86_400_000);
}

function hasCrew(order: Order, assignments: OrderAssignment[]): boolean {
  return (
    assignments.length > 0 ||
    (order.squadMemberIds?.length ?? 0) > 0 ||
    Boolean(order.team?.trim())
  );
}

function unconfirmedCrew(assignments: OrderAssignment[]): OrderAssignment[] {
  return assignments.filter(
    (a) =>
      a.assignmentStatus === "assigned" ||
      a.assignmentStatus === "cancelled" ||
      a.assignmentStatus === "no_show"
  );
}

function overdueDeliveries(
  order: Order,
  deliveries: OrderDelivery[],
  asOf: string
): boolean {
  if (
    isOrderActiveWorkload(order.status) &&
    order.deliveryDate &&
    order.deliveryDate < asOf
  ) {
    return true;
  }
  return deliveries.some(
    (d) =>
      (d.status === "pending" || d.status === "in_progress") &&
      d.dueDate < asOf
  );
}

/**
 * Derive a single health verdict from live order conditions.
 * Worst signal wins.
 */
export function deriveOrderHealth(input: OrderHealthInput): OrderHealthVerdict {
  const { order, finance, assignments, deliveries, asOf } = input;

  if (order.status === "Cancelled") {
    return {
      level: "watch",
      label: "Cancelled",
      reason: "This order is cancelled — no active production risk.",
    };
  }

  const paymentAttention = paymentAttentionFrom(
    finance.outstanding,
    order,
    asOf
  );
  const shootIn = daysUntil(order.shootDate, asOf);
  const crewMissing =
    isOrderActiveWorkload(order.status) && !hasCrew(order, assignments);
  const unconfirmed = unconfirmedCrew(assignments).filter(
    (a) => a.assignmentStatus === "assigned"
  );
  const deliveryOverdue = overdueDeliveries(order, deliveries, asOf);
  const shootSoon = shootIn != null && shootIn >= 0 && shootIn <= 1;
  const shootIn48 = shootIn != null && shootIn >= 0 && shootIn <= 2;

  if (deliveryOverdue) {
    return {
      level: "critical",
      label: "Critical — overdue delivery",
      reason: `Client promise past due (${order.deliveryDate || "delivery"}).`,
    };
  }

  if (paymentAttention === "unpaid_overdue") {
    return {
      level: "critical",
      label: "Critical — unpaid overdue",
      reason: `Outstanding ${finance.outstanding.toLocaleString("en-EG")} EGP past due.`,
    };
  }

  if (crewMissing && shootSoon) {
    return {
      level: "critical",
      label: "Critical — no crew",
      reason: "Shoot is imminent and no crew is assigned.",
    };
  }

  if (unconfirmed.length > 0 && shootIn48) {
    return {
      level: "critical",
      label: "Critical — crew unconfirmed",
      reason: `${unconfirmed.length} assignment(s) still awaiting confirm before shoot.`,
    };
  }

  if (crewMissing && isOrderActiveWorkload(order.status)) {
    return {
      level: "at_risk",
      label: "At risk — no crew",
      reason: "Active order with no team assigned.",
    };
  }

  if (unconfirmed.length > 0 && isOrderActiveWorkload(order.status)) {
    return {
      level: "at_risk",
      label: "At risk — crew unconfirmed",
      reason: `${unconfirmed.length} crew still on assigned (not confirmed).`,
    };
  }

  if (paymentAttention === "waiting_payment" && finance.outstanding > 0) {
    return {
      level: "watch",
      label: "Watch — money open",
      reason: `Outstanding ${finance.outstanding.toLocaleString("en-EG")} EGP still to collect.`,
    };
  }

  if (isOrderHolding(order.status)) {
    return {
      level: "watch",
      label: "Holding",
      reason: "Order is not yet confirmed into the live pipeline.",
    };
  }

  const unpaidCrew = assignments.filter(
    (a) =>
      (a.assignmentStatus === "completed" ||
        a.assignmentStatus === "checked_in" ||
        isOrderCompleted(order.status)) &&
      assignmentRemaining(a) > 0
  );
  if (unpaidCrew.length > 0) {
    return {
      level: "watch",
      label: "Watch — crew unpaid",
      reason: `${unpaidCrew.length} freelancer(s) still owed on this job.`,
    };
  }

  if (
    (order.status === "Shooting" ||
      order.status === "Editing" ||
      isOrderCompleted(order.status)) &&
    input.expenseCount === 0 &&
    (order.plannedExpenses?.some((l) => l.amount > 0) ||
      assignments.some((a) => a.employeePrice > 0))
  ) {
    return {
      level: "watch",
      label: "Watch — costs off-book",
      reason: "Production advanced but no expenses logged yet.",
    };
  }

  if (isOrderCompleted(order.status) && finance.outstanding <= 0.009) {
    return {
      level: "healthy",
      label: "Healthy",
      reason: "Delivery complete and collections clear.",
    };
  }

  if (isOrderActiveWorkload(order.status) || order.status === "Confirmed") {
    return {
      level: "healthy",
      label: "Healthy",
      reason: "No critical blockers on this order right now.",
    };
  }

  return {
    level: "healthy",
    label: "Stable",
    reason: "No urgent risk signals on this order.",
  };
}

/** Wedding | Commercial lane for identity strip (product lanes, not all project types). */
export function orderLane(
  projectType: Order["projectType"]
): "Wedding" | "Commercial" {
  if (projectType === "Wedding" || projectType === "Engagement") {
    return "Wedding";
  }
  return "Commercial";
}
