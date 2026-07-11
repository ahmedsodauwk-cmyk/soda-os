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

export interface NotificationRecord {
  id: string;
  eventId: string;
  eventType: BusinessEventType;
  createdAt: string;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  entityType: BusinessEntityType;
  entityId: string;
}
