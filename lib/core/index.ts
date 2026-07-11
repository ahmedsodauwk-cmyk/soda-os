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
  listBusinessEvents,
} from "@/lib/core/events-store";

export {
  appendAuditFromEvent,
  getAuditByEntity,
  listAuditLog,
} from "@/lib/core/audit/engine";

export {
  clearNotifications,
  listNotifications,
  listUnreadNotifications,
  markNotificationRead,
  recordNotificationFromEvent,
} from "@/lib/core/notifications/engine";

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
