/**
 * Project Journey — required lifecycle on every project.
 * Owner always sees current stage via Project.journeyStage.
 */

export const JOURNEY_STAGES = [
  "Inquiry",
  "Quotation",
  "Approved",
  "PreProduction",
  "Shoot",
  "Editing",
  "Review",
  "Revision",
  "Delivery",
  "Invoice",
  "Payment",
  "Closed",
] as const;

export type JourneyStage = (typeof JOURNEY_STAGES)[number];

export const JOURNEY_STAGE_LABELS: Record<JourneyStage, string> = {
  Inquiry: "Inquiry",
  Quotation: "Quotation",
  Approved: "Approved",
  PreProduction: "Pre-production",
  Shoot: "Shoot",
  Editing: "Editing",
  Review: "Review",
  Revision: "Revision",
  Delivery: "Delivery",
  Invoice: "Invoice",
  Payment: "Payment",
  Closed: "Closed",
};

export function journeyStageIndex(stage: JourneyStage): number {
  return JOURNEY_STAGES.indexOf(stage);
}

export function isJourneyComplete(stage: JourneyStage): boolean {
  return stage === "Closed";
}
