import type { JourneyStage } from "@/lib/journey/types";

/**
 * Explicit journey stage per project — source of truth for Project Hub.
 * Keep in sync with project IDs in lib/projects/mock-data.ts.
 */
export const PROJECT_JOURNEY_STAGES: Record<string, JourneyStage> = {
  "PRJ-2026-0001": "Editing", // Future City — Palm Hills
  "PRJ-2026-0002": "Revision", // Galaxy daily
  "PRJ-2026-0003": "Approved", // Dr Hana
  "PRJ-2026-0004": "PreProduction", // Wav partner
  "PRJ-2026-0005": "Editing", // Last Step
  "PRJ-2026-0006": "Payment", // Palm Hills corporate
  "PRJ-2026-0007": "PreProduction", // Vodafone
  "PRJ-2026-0008": "Editing", // Ahmed Ali wedding
  "PRJ-2026-0009": "PreProduction", // Mamdouh wedding
  "PRJ-2026-0010": "Quotation", // Karim & Dina
  "PRJ-2026-0011": "Shoot", // Fashion / portrait lane
  "PRJ-2026-0012": "Shoot", // Cairo Fashion Week
  "PRJ-2026-0013": "Shoot", // TechVentures event
  "PRJ-2026-0014": "Editing", // Layla engagement
  "PRJ-2026-0015": "PreProduction", // Yasmin
  "PRJ-2026-0016": "Closed", // Omar cancelled commercial
};

export function getProjectJourneyStage(
  projectId: string,
  fallback: JourneyStage = "Inquiry"
): JourneyStage {
  return PROJECT_JOURNEY_STAGES[projectId] ?? fallback;
}
