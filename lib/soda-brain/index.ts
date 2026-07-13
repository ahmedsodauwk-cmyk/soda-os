/**
 * SODA Brain — public Decision Engine API.
 *
 * Order Workspace UI imports from here only.
 * Signal helpers under this folder are internal orchestration units.
 */

export {
  evaluateOrderOperationalTruth,
  type EvaluateOrderBrainInput,
  type OrderHealthBand,
  type OrderHealthTruth,
  type OrderOperationalTruth,
} from "@/lib/soda-brain/evaluate";

export type {
  DoNowAction,
  DoNowActionId,
  DoNowDestination,
  DoNowPriority,
  NeedsDecisionItem,
  WhatsNextItem,
  WorkspaceCapabilities,
} from "@/lib/soda-brain/do-now";

export type { FinancialAssistantPrompt } from "@/lib/soda-brain/financial-assistant";
