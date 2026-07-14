/**
 * SODA Brain Intelligence Layer (Mission 05.2 → Operations Desk 05.3).
 * Parser + Memory + Context + Smart Questions — local heuristics only.
 * Never writes ERP. Never calls external AI APIs.
 * Execute lives in `@/lib/brain/execute-engine` (Founder-gated).
 */

export type {
  BrainUnderstanding,
  RelatedMemory,
  EntityTimeline,
  EntityTimelineEvent,
  IntelligenceParseResult,
  UnderstandingEdits,
  OpsIntent,
  DraftLifecycle,
  ExecuteTarget,
  OpsEntity,
  PotentialAction,
  ErpAwarenessHit,
} from "@/lib/brain/intelligence/types";

export { OPS_INTENTS, DRAFT_LIFECYCLE } from "@/lib/brain/intelligence/types";

export {
  parseBrainText,
  extractAmount,
  extractCurrency,
  extractPhone,
} from "@/lib/brain/intelligence/parser";

export {
  buildFounderSummary,
  buildUnderstandingBullets,
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
  approveUnderstanding,
  applyFollowUpAnswer,
} from "@/lib/brain/intelligence/pipeline";

export {
  computeMissingFields,
  nextSmartQuestion,
  canApproveDraft,
  defaultExecuteTarget,
  buildPotentialActions,
} from "@/lib/brain/intelligence/questions";

export {
  enrichOperationsUnderstanding,
  workspaceToIntent,
  detectExplicitErpIntent,
  buildEntities,
} from "@/lib/brain/intelligence/ops-enrich";

export {
  findErpAwarenessHits,
  loadErpAwarenessForLabels,
} from "@/lib/brain/intelligence/erp-awareness";
