/**
 * Business Core — event vocabulary.
 * Events are the cross-module contract; UI stays presentation-only.
 */

export const BUSINESS_EVENT_TYPES = [
  "ClientCreated",
  "ClientUpdated",
  "ProjectCreated",
  "ProjectUpdated",
  "OrderCreated",
  "OrderUpdated",
  "OrderConfirmed",
  "OrderCompleted",
  "OrderCancelled",
  "OrderRescheduled",
  "PaymentReceived",
  "PaymentUpdated",
  "InvoiceCreated",
  "InvoicePaid",
  "InvoiceUpdated",
  "DeliveryCompleted",
  "DeliveryCreated",
  "CrewAssigned",
  "CrewRemoved",
  "CrewPaid",
  "CrewBonusGenerated",
  "EquipmentAssigned",
  "EquipmentReturned",
  "QuotationConverted",
  "FinancialReversed",
  "FinancialVoided",
  "FinancialCorrected",
  "ExpenseRecorded",
  "TransferCompleted",
  "PeriodClosed",
  "PeriodReopened",
  "OpeningBalancePosted",
  "ManualAdjustmentPosted",
] as const;

export type BusinessEventType = (typeof BUSINESS_EVENT_TYPES)[number];

export type BusinessEntityType =
  | "client"
  | "project"
  | "order"
  | "payment"
  | "invoice"
  | "delivery"
  | "assignment"
  | "equipment"
  | "quotation"
  | "person"
  | "system";

export interface BusinessEventPayload {
  /** Primary entity id for this event */
  entityId: string;
  entityType: BusinessEntityType;
  /** Related ids for sync handlers */
  clientId?: string;
  projectId?: string;
  orderId?: string;
  paymentId?: string;
  invoiceId?: string;
  deliveryId?: string;
  assignmentId?: string;
  personId?: string;
  equipmentId?: string;
  quotationId?: string;
  /** Free-form structured data (status before/after, amounts, etc.) */
  data?: Record<string, unknown>;
  /** Human-readable summary for notifications / audit */
  summary?: string;
}

export interface BusinessEvent {
  id: string;
  type: BusinessEventType;
  occurredAt: string;
  /** Module / function that published (e.g. "orders.engine.confirmOrder") */
  source: string;
  payload: BusinessEventPayload;
  /** Correlation for multi-step workflows */
  correlationId?: string;
}

export type BusinessEventInput = {
  type: BusinessEventType;
  source: string;
  payload: BusinessEventPayload;
  occurredAt?: string;
  correlationId?: string;
  id?: string;
};

export type BusinessEventHandler = (
  event: BusinessEvent
) => void | Promise<void>;

export interface AuditLogEntry {
  id: string;
  eventId: string;
  eventType: BusinessEventType;
  occurredAt: string;
  source: string;
  entityType: BusinessEntityType;
  entityId: string;
  summary: string;
  payload: BusinessEventPayload;
}

/** Human Experience — urgency for the Notification Center (never raw event names). */
export type NotificationPriority = "urgent" | "high" | "normal" | "low";

export interface NotificationRecord {
  id: string;
  eventId: string;
  eventType: BusinessEventType;
  createdAt: string;
  /** Egyptian Arabic — never PascalCase event names. */
  title: string;
  body: string;
  href?: string;
  read: boolean;
  entityType: BusinessEntityType;
  entityId: string;
  /** Human priority for sorting / visual weight. */
  priority: NotificationPriority;
  /**
   * Confirm / Decline for crew assignment decisions (CrewAssigned).
   * Other events keep view-only + disabled placeholders.
   */
  actions?: NotificationAction[];
}

/** Notification decision CTA — Confirm/Decline for crew assignments. */
export type NotificationActionKind = "confirm" | "decline" | "view";

export interface NotificationAction {
  kind: NotificationActionKind;
  label: string;
  href?: string;
  /** When false, UI may show a disabled placeholder; default true when present. */
  enabled?: boolean;
  /** Assignment id for confirm/decline server actions. */
  assignmentId?: string;
}
