/**
 * Synchronization engine — handlers that update related module state
 * when business events fire. Modules do not call each other directly.
 */

import { subscribe } from "@/lib/core/bus";
import type { BusinessEvent } from "@/lib/core/types";
import {
  isOrderHolding,
  mapOrderStatusToProjectStatus,
} from "@/lib/orders/status";
import type { Order } from "@/lib/orders/types";

/**
 * Sync project calendar + status from an order snapshot in the event payload.
 * Used when order mutations publish with `data.order` or related ids.
 */
async function syncProjectFromOrderPayload(
  event: BusinessEvent
): Promise<void> {
  const orderData = event.payload.data?.order as Order | undefined;
  const projectId =
    event.payload.projectId ??
    orderData?.projectId ??
    (event.payload.entityType === "project" ? event.payload.entityId : undefined);

  if (!projectId || !orderData) return;

  // Dynamic import avoids circular deps with projects/orders repos
  const { updateProject } = await import("@/lib/projects/repository");

  const calendar =
    isOrderHolding(orderData.status) || orderData.status === "Cancelled"
      ? []
      : [
          ...(orderData.shootDate
            ? [
                {
                  id: `ord-shoot-${orderData.id}`,
                  title: `Shoot · ${orderData.clientName}`,
                  startsAt: `${orderData.shootDate}T09:00:00Z`,
                  kind: "shoot" as const,
                  location: orderData.location || undefined,
                },
              ]
            : []),
          ...(orderData.deliveryDate
            ? [
                {
                  id: `ord-delivery-${orderData.id}`,
                  title: `Delivery · ${orderData.clientName}`,
                  startsAt: `${orderData.deliveryDate}T17:00:00Z`,
                  kind: "delivery" as const,
                },
              ]
            : []),
        ];

  await updateProject(projectId, {
    status: mapOrderStatusToProjectStatus(orderData.status),
    clientName: orderData.clientName,
    ...(orderData.clientId ? { clientId: orderData.clientId } : {}),
    calendar,
    lastActivity: event.occurredAt,
  });
}

/**
 * When payment is received, bump linked project lastActivity if known.
 */
async function touchProjectOnPayment(event: BusinessEvent): Promise<void> {
  const projectId = event.payload.projectId;
  if (!projectId) return;
  const { updateProject } = await import("@/lib/projects/repository");
  await updateProject(projectId, {
    lastActivity: event.occurredAt,
  });
}

/**
 * When delivery is completed, advance project journey toward Delivery when linked.
 */
async function syncJourneyOnDelivery(event: BusinessEvent): Promise<void> {
  const projectId = event.payload.projectId;
  if (!projectId) return;
  const { updateProject } = await import("@/lib/projects/repository");
  await updateProject(projectId, {
    journeyStage: "Delivery",
    lastActivity: event.occurredAt,
  });
}

/**
 * Skip heavy project rewrite when the publisher already synced
 * (Smart Order engine sets data.projectSynced = true).
 */
function alreadySynced(event: BusinessEvent): boolean {
  return event.payload.data?.projectSynced === true;
}

async function onOrderLifecycle(event: BusinessEvent): Promise<void> {
  if (alreadySynced(event)) return;
  await syncProjectFromOrderPayload(event);
}

export function registerSyncHandlers(): void {
  subscribe("OrderCreated", onOrderLifecycle);
  subscribe("OrderUpdated", onOrderLifecycle);
  subscribe("OrderConfirmed", onOrderLifecycle);
  subscribe("OrderCompleted", onOrderLifecycle);
  subscribe("OrderCancelled", onOrderLifecycle);
  subscribe("PaymentReceived", touchProjectOnPayment);
  subscribe("DeliveryCompleted", syncJourneyOnDelivery);
  subscribe("DeliveryCreated", syncJourneyOnDelivery);
}
