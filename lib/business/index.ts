export type { ClientComputedStats, ProjectComputedStats, WorkspaceComputedStats } from "@/lib/business/types";
export { BUSINESS_NOW_ISO, BUSINESS_TODAY } from "@/lib/business/types";
export { computeProgressFromOrders } from "@/lib/business/progress";
export {
  computeLastActivity,
  computeProjectStats,
  computeUpcomingShoots,
  toProjectOrderStub,
} from "@/lib/business/project-stats";
export { computeClientStats } from "@/lib/business/client-stats";
export { computeWorkspaceStats } from "@/lib/business/workspace-stats";
export {
  resolveOrderClientId,
  resolveOrderClientName,
  resolveOrderWorkspaceId,
} from "@/lib/business/relations";
export { ensureOrderProjectLink, findClientByName } from "@/lib/business/link-order";
