import {
  JOURNEY_STAGES,
  type JourneyStage,
} from "@/lib/journey/types";
import type { OrderStatus } from "@/lib/orders/types";

/** Map order pipeline status → approximate journey stage (fallback). */
export function journeyFromOrderStatus(status: OrderStatus): JourneyStage {
  switch (status) {
    case "Holding":
    case "Pending":
      return "Approved";
    case "Confirmed":
    case "Scheduled":
      return "PreProduction";
    case "Shooting":
      return "Shoot";
    case "Editing":
      return "Editing";
    case "Completed":
    case "Delivered":
      return "Delivery";
    case "Cancelled":
      return "Closed";
    default:
      return "Inquiry";
  }
}

/** Advance helper for UI / future mutations. */
export function nextJourneyStage(stage: JourneyStage): JourneyStage | null {
  const i = JOURNEY_STAGES.indexOf(stage);
  if (i < 0 || i >= JOURNEY_STAGES.length - 1) return null;
  return JOURNEY_STAGES[i + 1]!;
}

export function previousJourneyStage(stage: JourneyStage): JourneyStage | null {
  const i = JOURNEY_STAGES.indexOf(stage);
  if (i <= 0) return null;
  return JOURNEY_STAGES[i - 1]!;
}
