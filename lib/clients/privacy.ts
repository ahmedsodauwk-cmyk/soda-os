/**
 * Client privacy — order-context whitelist for non-Founder operators.
 * Full Client objects must not leak outside Founder surfaces.
 */

import type { Client } from "@/lib/clients/types";
import type { Order } from "@/lib/orders/types";
import type { AccessLevel } from "@/lib/identity/access-levels";
import { isFounderAccess } from "@/lib/identity/access-levels";

/** Fields safe to show on authorized order detail for non-Founder. */
export type OrderClientSnapshot = {
  displayName: string;
  projectType: string;
  segmentLabel?: string;
  shootDate?: string;
  location?: string;
  whatsapp?: string;
};

export const ORDER_CLIENT_WHITELIST_KEYS = [
  "displayName",
  "projectType",
  "segmentLabel",
  "shootDate",
  "location",
  "whatsapp",
] as const;

/** Non-Founder may not browse client directory / profile routes. */
export function mayBrowseClientDirectory(level: AccessLevel): boolean {
  return isFounderAccess(level);
}

/** Non-Founder may not link to client workspace from order chrome. */
export function mayLinkToClientProfile(level: AccessLevel): boolean {
  return isFounderAccess(level);
}

function segmentLabel(segment: Client["segment"] | undefined): string | undefined {
  if (!segment) return undefined;
  if (segment === "commercial") return "Commercial";
  if (segment === "wedding") return "Wedding";
  return segment;
}

/**
 * Build whitelisted client snapshot from order (+ optional client row).
 * Never returns id, email, notes, financials, or full Client.
 */
export function orderClientSnapshot(
  order: Order,
  client?: Client | null
): OrderClientSnapshot {
  const snapshot: OrderClientSnapshot = {
    displayName: order.clientName,
    projectType: order.projectType,
    ...(order.shootDate ? { shootDate: order.shootDate } : {}),
    ...(order.location ? { location: order.location } : {}),
    ...(order.whatsapp ? { whatsapp: order.whatsapp } : {}),
  };

  if (client?.segment) {
    snapshot.segmentLabel = segmentLabel(client.segment);
  }

  return snapshot;
}

/** Strip Client to whitelist when non-Founder needs segment hint only. */
export function clientToOrderContext(
  client: Client | null | undefined,
  order: Order
): OrderClientSnapshot {
  return orderClientSnapshot(order, client);
}
