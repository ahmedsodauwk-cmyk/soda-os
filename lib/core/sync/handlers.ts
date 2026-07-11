/**
 * Synchronization engine — thin project touch helpers.
 * Heavy order/calendar/finance sync lives in Business Rules (lib/core/rules).
 */

import { subscribe } from "@/lib/core/bus";
import type { BusinessEvent } from "@/lib/core/types";
import { syncProjectCalendarFromOrder } from "@/lib/core/rules/order-effects";
import type { Order } from "@/lib/orders/types";

/**
 * Fallback project sync when publisher did not already sync
 * and rules did not run with order payload (legacy paths).
 */
async function syncProjectFromOrderPayload(
  event: BusinessEvent
): Promise<void> {
  if (event.payload.data?.projectSynced === true) return;
  if (event.payload.data?.rulesOwned === true) return;

  const orderData = event.payload.data?.order as Order | undefined;
  if (!orderData) return;
  await syncProjectCalendarFromOrder(orderData, event.occurredAt);
}

async function touchProjectOnPayment(event: BusinessEvent): Promise<void> {
  const projectId = event.payload.projectId;
  if (!projectId) return;
  const { updateProject } = await import("@/lib/projects/repository");
  await updateProject(projectId, {
    lastActivity: event.occurredAt,
  });
}

async function syncJourneyOnDelivery(event: BusinessEvent): Promise<void> {
  const projectId = event.payload.projectId;
  if (!projectId) return;
  const { updateProject } = await import("@/lib/projects/repository");
  await updateProject(projectId, {
    journeyStage: "Delivery",
    lastActivity: event.occurredAt,
  });
}

export function registerSyncHandlers(): void {
  subscribe("OrderCreated", syncProjectFromOrderPayload);
  subscribe("OrderUpdated", syncProjectFromOrderPayload);
  subscribe("OrderConfirmed", syncProjectFromOrderPayload);
  subscribe("OrderCompleted", syncProjectFromOrderPayload);
  subscribe("OrderCancelled", syncProjectFromOrderPayload);
  subscribe("PaymentReceived", touchProjectOnPayment);
  subscribe("DeliveryCompleted", syncJourneyOnDelivery);
  subscribe("DeliveryCreated", syncJourneyOnDelivery);
}
