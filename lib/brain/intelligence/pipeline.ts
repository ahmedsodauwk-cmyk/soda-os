/**
 * Intelligence pipeline orchestrator (parse → memory → context → summary).
 * Pure functions over in-memory Brain entries. Persistence is Founder-gated in actions.
 */

import type { BrainEntry } from "@/lib/brain/types";
import { buildEntityTimelines, findRelatedMemories } from "@/lib/brain/intelligence/memory";
import { parseBrainText } from "@/lib/brain/intelligence/parser";
import { refreshUnderstandingSummaries } from "@/lib/brain/intelligence/summary";
import type {
  BrainUnderstanding,
  IntelligenceParseResult,
  UnderstandingEdits,
} from "@/lib/brain/intelligence/types";

export function runIntelligencePipeline(
  rawText: string,
  entries: BrainEntry[]
): IntelligenceParseResult {
  const understanding = parseBrainText(rawText);
  const related = findRelatedMemories(understanding, entries);
  const timelines = buildEntityTimelines(understanding, entries);

  const suggestions: string[] = [];
  for (const r of related) {
    if (r.suggestionAr) suggestions.push(r.suggestionAr);
  }
  // unique soft suggestions
  const unique = [...new Set(suggestions)].slice(0, 5);

  return {
    understanding,
    related,
    timelines,
    suggestions: unique,
  };
}

export function applyUnderstandingEdits(
  base: BrainUnderstanding,
  edits: UnderstandingEdits
): BrainUnderstanding {
  const next: BrainUnderstanding = {
    ...base,
    ...edits,
    rawText: base.rawText,
    reasons: base.reasons,
  };
  if (next.workspace !== "money_memory") {
    if (edits.moneyKind === undefined) next.moneyKind = null;
    if (edits.moneyDirection === undefined) next.moneyDirection = null;
  }
  return refreshUnderstandingSummaries(next);
}
