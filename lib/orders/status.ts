/**
 * Order status semantics for Smart Order Engine V3.
 * Holding/Pending → no finance forecast, calendar, or pending crew earnings.
 * Confirmed+ → calendar, assignments, forecast, dashboard pipeline.
 * Completed/Delivered → invoice/payroll ready.
 * Cancelled → release crew/equipment, reverse pending, remove calendar.
 */

import type { OrderStatus } from "@/lib/orders/types";

/** Statuses that block finance / calendar / crew earnings sync. */
export function isOrderHolding(status: OrderStatus): boolean {
  return status === "Holding" || status === "Pending";
}

/** Order is live in ops (confirmed pipeline, not cancelled). */
export function isOrderOperational(status: OrderStatus): boolean {
  return !isOrderHolding(status) && status !== "Cancelled";
}

/** Appears on calendar / upcoming jobs. */
export function isOrderCalendarVisible(status: OrderStatus): boolean {
  return isOrderOperational(status);
}

/** Counts toward revenue forecast / obligated totals. */
export function isOrderBillable(status: OrderStatus): boolean {
  return status !== "Cancelled" && !isOrderHolding(status);
}

/** Completed for invoice / payroll / bonus stats. */
export function isOrderCompleted(status: OrderStatus): boolean {
  return status === "Completed" || status === "Delivered";
}

/** Active workload (not holding, not done, not cancelled). */
export function isOrderActiveWorkload(status: OrderStatus): boolean {
  return (
    status === "Confirmed" ||
    status === "Scheduled" ||
    status === "Shooting" ||
    status === "Editing"
  );
}

/** Pipeline for dashboard schedule / attention. */
export function isOrderInPipeline(status: OrderStatus): boolean {
  return isOrderActiveWorkload(status) || isOrderHolding(status);
}

export const CREW_MONTHLY_BONUS_THRESHOLD = 20;
export const CREW_MONTHLY_BONUS_EGP = 3500;

/** Map V3 statuses to legacy CHECK values when migration not applied. */
export function toPersistedOrderStatus(status: OrderStatus): OrderStatus {
  switch (status) {
    case "Holding":
      return "Pending";
    case "Confirmed":
      return "Scheduled";
    case "Completed":
      return "Delivered";
    default:
      return status;
  }
}

/** Prefer V3 labels when reading legacy rows (optional display normalize). */
export function fromPersistedOrderStatus(status: OrderStatus): OrderStatus {
  return status;
}

/** Map order status → project status. */
export function mapOrderStatusToProjectStatus(
  status: OrderStatus
): "Active" | "OnHold" | "Completed" | "Cancelled" {
  if (status === "Cancelled") return "Cancelled";
  if (isOrderCompleted(status)) return "Completed";
  if (isOrderHolding(status)) return "OnHold";
  return "Active";
}
