import type { JourneyStage } from "@/lib/journey/types";

/**
 * Explicit journey stage per project — source of truth for Project Hub.
 * Populated as projects are created; starts empty after production reset.
 */
export const PROJECT_JOURNEY_STAGES: Record<string, JourneyStage> = {};

export function getProjectJourneyStage(
  projectId: string,
  fallback: JourneyStage = "Inquiry"
): JourneyStage {
  return PROJECT_JOURNEY_STAGES[projectId] ?? fallback;
}
