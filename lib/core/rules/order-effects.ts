/**
 * Shared order side-effects used by Business Rules (calendar, forecast, project).
 * Single implementation — engines must not duplicate this.
 */

import { createFinancialEvent, listFinancialEvents } from "@/lib/finance/repository";
import type { FinancialEvent } from "@/lib/finance/types";
import {
  isOrderBillable,
  isOrderHolding,
  mapOrderStatusToProjectStatus,
} from "@/lib/orders/status";
import type { Order } from "@/lib/orders/types";
import { updateProject } from "@/lib/projects/repository";

/** Sync project status + calendar entries from an order. */
export async function syncProjectCalendarFromOrder(
  order: Order,
  occurredAt?: string
): Promise<void> {
  if (!order.projectId) return;

  const calendar =
    isOrderHolding(order.status) || order.status === "Cancelled"
      ? []
      : [
          ...(order.shootDate
            ? [
                {
                  id: `ord-shoot-${order.id}`,
                  title: `Shoot · ${order.clientName}`,
                  startsAt: `${order.shootDate}T09:00:00Z`,
                  kind: "shoot" as const,
                  location: order.location || undefined,
                },
              ]
            : []),
          ...(order.deliveryDate
            ? [
                {
                  id: `ord-delivery-${order.id}`,
                  title: `Delivery · ${order.clientName}`,
                  startsAt: `${order.deliveryDate}T17:00:00Z`,
                  kind: "delivery" as const,
                },
              ]
            : []),
        ];

  await updateProject(order.projectId, {
    status: mapOrderStatusToProjectStatus(order.status),
    clientName: order.clientName,
    ...(order.clientId ? { clientId: order.clientId } : {}),
    calendar,
    lastActivity: occurredAt ?? new Date().toISOString(),
  });
}

/** Emit remaining-balance forecast adjustment (idempotent). */
export async function ensureOrderForecast(
  order: Order
): Promise<FinancialEvent | null> {
  if (!isOrderBillable(order.status)) return null;
  const remaining = Math.max(0, order.price - order.deposit);
  if (remaining <= 0) return null;

  const existing = listFinancialEvents().find(
    (e) =>
      e.parent.parentType === "order" &&
      e.parent.parentId === order.id &&
      e.metadata?.kind === "order_forecast"
  );
  if (existing) return existing;

  return createFinancialEvent({
    type: "adjustment",
    amount: remaining,
    currency: "EGP",
    direction: "inflow",
    notes: `Forecast remaining for order ${order.id}`,
    parent: { parentType: "order", parentId: order.id },
    metadata: {
      kind: "order_forecast",
      clientId: order.clientId,
      projectId: order.projectId,
      forecast: true,
      expectedRevenue: true,
    },
  });
}

/** Reverse forecast via neutralizing adjustment (never delete). */
export async function reverseOrderForecast(
  orderId: string
): Promise<FinancialEvent[]> {
  const created: FinancialEvent[] = [];
  const forecasts = listFinancialEvents().filter(
    (e) =>
      e.parent.parentType === "order" &&
      e.parent.parentId === orderId &&
      e.metadata?.kind === "order_forecast"
  );
  for (const forecast of forecasts) {
    const alreadyReversed = listFinancialEvents().some(
      (e) =>
        e.metadata?.kind === "order_forecast_reversal" &&
        e.metadata?.reversesEventId === forecast.id
    );
    if (alreadyReversed) continue;
    created.push(
      await createFinancialEvent({
        type: "adjustment",
        amount: forecast.amount,
        currency: "EGP",
        direction: "outflow",
        notes: `Reverse forecast for cancelled order ${orderId}`,
        parent: { parentType: "order", parentId: orderId },
        metadata: {
          kind: "order_forecast_reversal",
          reversesEventId: forecast.id,
          forecast: false,
          safetyAction: "reversal",
          originalEventId: forecast.id,
        },
      })
    );
  }
  return created;
}

/** Mark forecast as ready-for-collection metadata (completed orders). */
export async function markRevenueReadyForCollection(
  order: Order
): Promise<FinancialEvent | null> {
  if (!isOrderBillable(order.status)) return null;
  const forecast = listFinancialEvents().find(
    (e) =>
      e.parent.parentType === "order" &&
      e.parent.parentId === order.id &&
      e.metadata?.kind === "order_forecast"
  );
  if (!forecast) {
    return ensureOrderForecast(order);
  }
  // Immutable — post a marker adjustment of 0 via metadata-only note event
  // using a tiny adjustment tagged ready_for_collection (amount 0 not allowed).
  // Instead: ensure forecast exists; readiness is derived from order status.
  return forecast;
}
