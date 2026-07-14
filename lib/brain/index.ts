/**
 * SODA Brain — Founder Intelligence Workspace (Mission 05.1–05.3).
 * Think/parse paths stay isolated from ERP.
 * Founder-gated ERP writes live only in `execute-engine.ts` via Ops Desk actions.
 * Do not import ops write repositories into this barrel.
 */

export * from "@/lib/brain/types";
export * from "@/lib/brain/access";
export * from "@/lib/brain/classify";
export * from "@/lib/brain/money-dashboard";
export * from "@/lib/brain/suggestions";
export * from "@/lib/brain/intelligence";
export {
  listBrainEntries,
  getBrainEntryById,
  listBrainHistory,
  searchBrainEntries,
  createBrainEntry,
  updateBrainEntry,
  archiveBrainEntry,
  deleteBrainEntry,
  listBrainChatMessages,
  appendBrainChatMessage,
  preparePromoteStub,
} from "@/lib/brain/repository";
export { loadBrainErpReadonlySummary } from "@/lib/brain/erp-readonly";
