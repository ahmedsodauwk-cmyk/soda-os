/**
 * Human Notification priority — ranks business signals for the center.
 * Presentation only; does not change business rules.
 */

import type {
  BusinessEvent,
  BusinessEventType,
  NotificationPriority,
} from "@/lib/core/types";

const PRIORITY_RANK: Record<NotificationPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

const TYPE_PRIORITY: Partial<Record<BusinessEventType, NotificationPriority>> = {
  OrderCancelled: "urgent",
  FinancialVoided: "urgent",
  FinancialReversed: "urgent",
  PaymentReceived: "high",
  InvoicePaid: "high",
  CrewAssigned: "high",
  OrderConfirmed: "high",
  OrderCreated: "high",
  QuotationConverted: "high",
  DeliveryCompleted: "high",
  CrewPaid: "high",
  OrderCompleted: "normal",
  OrderUpdated: "normal",
  OrderRescheduled: "normal",
  InvoiceCreated: "normal",
  InvoiceUpdated: "normal",
  PaymentUpdated: "normal",
  DeliveryCreated: "normal",
  ProjectCreated: "normal",
  ProjectUpdated: "low",
  ClientCreated: "normal",
  ClientUpdated: "low",
  CrewRemoved: "normal",
  CrewBonusGenerated: "normal",
  EquipmentAssigned: "low",
  EquipmentReturned: "low",
  ExpenseRecorded: "normal",
  TransferCompleted: "normal",
  PeriodClosed: "normal",
  PeriodReopened: "high",
  OpeningBalancePosted: "low",
  ManualAdjustmentPosted: "normal",
  FinancialCorrected: "high",
};

export function priorityForEvent(event: BusinessEvent): NotificationPriority {
  return TYPE_PRIORITY[event.type] ?? "normal";
}

export function notificationPriorityRank(
  priority: NotificationPriority
): number {
  return PRIORITY_RANK[priority];
}

/** Sort: urgent → high → normal → low, then newest first. */
export function compareNotificationsByPriority(
  a: { priority: NotificationPriority; createdAt: string },
  b: { priority: NotificationPriority; createdAt: string }
): number {
  const byPriority =
    notificationPriorityRank(a.priority) -
    notificationPriorityRank(b.priority);
  if (byPriority !== 0) return byPriority;
  return b.createdAt.localeCompare(a.createdAt);
}
