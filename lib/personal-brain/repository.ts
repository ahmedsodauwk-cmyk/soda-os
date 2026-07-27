/**
 * Personal Brain — gated repository (no Production DB until migration approved).
 */

import { isPersonalBrainUiEnabled } from "@/lib/personal-brain/feature-flag";

export type PersonalBrainEntry = {
  id: string;
  title: string | null;
  body: string;
  workspace: string;
  updatedAt: string;
};

/** Returns empty until UI flag + migration are approved on Production. */
export async function listPersonalBrainEntries(): Promise<PersonalBrainEntry[]> {
  if (!isPersonalBrainUiEnabled()) return [];
  return [];
}
