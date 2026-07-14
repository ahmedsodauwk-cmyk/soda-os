/**
 * SODA Brain — Founder Intelligence Workspace (Mission 05.1).
 * Isolated from ERP. Do not import ops write repositories here.
 */

export * from "@/lib/brain/types";
export * from "@/lib/brain/access";
export * from "@/lib/brain/classify";
export * from "@/lib/brain/money-dashboard";
export * from "@/lib/brain/suggestions";
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
