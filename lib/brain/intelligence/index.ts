/**
 * SODA Brain Intelligence Layer (Mission 05.2).
 * Parser + Memory + Context — local heuristics only.
 * Never writes ERP. Never calls external AI APIs.
 */

export type {
  BrainUnderstanding,
  RelatedMemory,
  EntityTimeline,
  EntityTimelineEvent,
  IntelligenceParseResult,
  UnderstandingEdits,
} from "@/lib/brain/intelligence/types";

export {
  parseBrainText,
  extractAmount,
  extractCurrency,
  extractPhone,
} from "@/lib/brain/intelligence/parser";

export {
  buildFounderSummary,
  refreshUnderstandingSummaries,
} from "@/lib/brain/intelligence/summary";

export {
  findRelatedMemories,
  buildEntityTimelines,
} from "@/lib/brain/intelligence/memory";

export {
  buildRelatedContext,
  searchContextByWorkspaces,
} from "@/lib/brain/intelligence/context";

export {
  runIntelligencePipeline,
  applyUnderstandingEdits,
} from "@/lib/brain/intelligence/pipeline";
