/**
 * Notification Center categories — presentation grouping only.
 * Scope isolation remains Mission 04.5 (data-scope); never expand visibility here.
 */

import type {
  BusinessEvent,
  BusinessEventType,
  NotificationCategory,
} from "@/lib/core/types";

const TYPE_CATEGORY: Partial<Record<BusinessEventType, NotificationCategory>> =
  {
    OrderCreated: "orders",
    OrderUpdated: "orders",
    OrderConfirmed: "orders",
    OrderCompleted: "orders",
    OrderCancelled: "orders",
    OrderRescheduled: "calendar",
    DeliveryCompleted: "orders",
    DeliveryCreated: "orders",
    QuotationConverted: "orders",
    PaymentReceived: "finance",
    PaymentUpdated: "finance",
    InvoiceCreated: "finance",
    InvoicePaid: "finance",
    InvoiceUpdated: "finance",
    CrewPaid: "finance",
    ExpenseRecorded: "finance",
    TransferCompleted: "finance",
    FinancialReversed: "finance",
    FinancialVoided: "finance",
    FinancialCorrected: "finance",
    PeriodClosed: "finance",
    PeriodReopened: "finance",
    OpeningBalancePosted: "finance",
    ManualAdjustmentPosted: "finance",
    CrewAssigned: "crew",
    CrewRemoved: "crew",
    CrewBonusGenerated: "crew",
    EquipmentAssigned: "crew",
    EquipmentReturned: "crew",
    ClientCreated: "clients",
    ClientUpdated: "clients",
    ProjectCreated: "clients",
    ProjectUpdated: "clients",
  };

export const NOTIFICATION_CATEGORY_LABELS: Record<
  NotificationCategory,
  string
> = {
  orders: "الأوردرات",
  finance: "المالية",
  crew: "الفريق",
  calendar: "التقويم",
  clients: "العملاء",
  authority: "الصلاحيات",
  brain: "البراين",
  system: "النظام",
  personal: "شخصي",
};

/** Category emoji — presentation only (Mission 06.2). */
export const NOTIFICATION_CATEGORY_ICONS: Record<NotificationCategory, string> =
  {
    orders: "📦",
    finance: "💰",
    crew: "👤",
    calendar: "📅",
    clients: "🏢",
    authority: "⚙️",
    brain: "🧠",
    system: "⚙️",
    personal: "👤",
  };

export function categoryIcon(category: NotificationCategory): string {
  return NOTIFICATION_CATEGORY_ICONS[category] ?? "⚙️";
}

export function categoryForEvent(event: BusinessEvent): NotificationCategory {
  return TYPE_CATEGORY[event.type] ?? "system";
}

export function categoryLabel(category: NotificationCategory): string {
  return NOTIFICATION_CATEGORY_LABELS[category];
}
