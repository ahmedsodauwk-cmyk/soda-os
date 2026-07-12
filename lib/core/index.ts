/**
 * SODA Business Core — event-driven coordination layer.
 * Business Rules = source of truth. UI = presentation only.
 *
 * Modules write their own tables, then publishBusinessEvent().
 * Handlers sync related state (calendar, finance hooks, stats, notifications, audit).
 */

export type {
  AuditLogEntry,
  BusinessEntityType,
  BusinessEvent,
  BusinessEventHandler,
  BusinessEventInput,
  BusinessEventPayload,
  BusinessEventType,
  NotificationAction,
  NotificationActionKind,
  NotificationPriority,
  NotificationRecord,
} from "@/lib/core/types";

export { BUSINESS_EVENT_TYPES } from "@/lib/core/types";

export {
  emit,
  resetBus,
  subscribe,
  subscriberCount,
  unsubscribe,
} from "@/lib/core/bus";

export {
  publishBusinessEvent,
  publishBusinessEventBackground,
} from "@/lib/core/publish";

export {
  bootstrapBusinessCore,
  isBusinessCoreBootstrapped,
} from "@/lib/core/bootstrap";

export {
  getBusinessEventsByEntity,
  getBusinessEventsByEntityFromDb,
  listBusinessEvents,
  refreshBusinessEventsFromDb,
} from "@/lib/core/events-store";

export {
  appendAuditFromEvent,
  getAuditByEntity,
  listAuditLog,
  refreshAuditLogFromDb,
} from "@/lib/core/audit/engine";

export {
  clearNotifications,
  hydrateNotificationsFromEvents,
  listNotifications,
  listUnreadNotifications,
  markNotificationRead,
  notificationActionLabel,
  notificationDisplayBody,
  notificationDisplayTitle,
  notificationHref,
  notificationPriorityLabel,
  recordNotificationFromEvent,
} from "@/lib/core/notifications/engine";

export { loadHydratedNotifications } from "@/lib/core/notifications/load";

export {
  compareNotificationsByPriority,
  notificationPriorityRank,
  priorityForEvent,
} from "@/lib/core/notifications/priority";

export {
  clearStatsDirty,
  getStatsGeneration,
  getStatsMeta,
  isDashboardDirty,
  markStatsDirtyFromEvent,
} from "@/lib/core/stats/engine";

export {
  clearFinanceHookDirty,
  getFinanceHookSnapshot,
  runFinanceAggregatorHook,
} from "@/lib/core/finance/hooks";

export {
  areBusinessRulesRegistered,
  clearRegisteredRules,
  ensureOrderForecast,
  executeRulesForEvent,
  getBusinessCoreHealth,
  getClientProfileStats,
  getDashboardFromBusinessCore,
  getFinancialReportSnapshot,
  getRecentRuleResults,
  listRegisteredRules,
  listRulesByGroup,
  markRevenueReadyForCollection,
  refreshDashboardAggregator,
  registerAllBusinessRules,
  registerRule,
  reverseOrderForecast,
  syncProjectCalendarFromOrder,
} from "@/lib/core/rules";

export type {
  BusinessRule,
  BusinessRuleContext,
  BusinessRuleHandler,
  RuleGroupId,
  RuleRunResult,
} from "@/lib/core/rules";
