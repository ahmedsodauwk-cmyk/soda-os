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

/**
 * Lifecycle (Mission 06.1): Unread → Read → Acknowledged (if required) → Completed.
 * No forever-stale rows — business completion / dismiss / archive advances state.
 */
export type NotificationLifecycleStatus =
  | "unread"
  | "read"
  | "acknowledged"
  | "completed";

/** Filter categories — presentation only; scope still from Mission 04.5. */
export type NotificationCategory =
  | "orders"
  | "finance"
  | "crew"
  | "calendar"
  | "clients"
  | "authority"
  | "brain"
  | "system"
  | "personal";

export interface NotificationRelatedObject {
  type: BusinessEntityType | "finance" | "calendar" | "brain";
  id?: string;
  label: string;
  href: string;
}

export interface NotificationHistoryEntry {
  at: string;
  status: NotificationLifecycleStatus | "archived" | "dismissed";
  note?: string;
}

export interface NotificationRecord {
  id: string;
  eventId: string;
  eventType: BusinessEventType;
  createdAt: string;
  /** Egyptian Arabic — never PascalCase event names. */
  title: string;
  body: string;
  href?: string;
  /** Derived: status === "unread". Badge uses this only. */
  read: boolean;
  /** Durable lifecycle — persisted per user when possible. */
  status: NotificationLifecycleStatus;
  category: NotificationCategory;
  entityType: BusinessEntityType;
  entityId: string;
  /** Human priority for sorting / visual weight. */
  priority: NotificationPriority;
  /** CrewAssigned and similar — Confirm workflow required. */
  requiresAck?: boolean;
  acknowledgedAt?: string;
  completedAt?: string;
  archivedAt?: string;
  dismissedAt?: string;
  relatedObjects?: NotificationRelatedObject[];
  history?: NotificationHistoryEntry[];
  /**
   * Action CTAs — Confirm/Decline when server APIs exist; Navigate/Open otherwise.
   * Never invent ERP writes without existing APIs.
   */
  actions?: NotificationAction[];
}

/**
 * Notification decision CTAs.
 * accept/reject alias confirm/decline for Accept workflow copy.
 */
export type NotificationActionKind =
  | "confirm"
  | "decline"
  | "accept"
  | "reject"
  | "view"
  | "open"
  | "navigate"
  | "call"
  | "view_order"
  | "assign_crew"
  | "mark_paid"
  | "mark_delivered"
  | "dismiss";

export interface NotificationAction {
  kind: NotificationActionKind;
  label: string;
  href?: string;
  /** When false, UI may show a disabled placeholder; default true when present. */
  enabled?: boolean;
  /** Assignment id for confirm/decline server actions. */
  assignmentId?: string;
  /** Optional tel: target when a phone is known on the related person. */
  phone?: string;
}
