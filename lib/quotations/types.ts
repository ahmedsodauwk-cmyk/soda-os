/**
 * Quotation Engine — business object with lifecycle (not a PDF generator).
 *
 * ## Pipeline (hub Kanban) ↔ Approval status mapping
 *
 * | Pipeline stage          | Typical approval status                          |
 * |-------------------------|--------------------------------------------------|
 * | New Inquiry             | Draft                                            |
 * | Discovery               | Draft                                            |
 * | Draft                   | Draft                                            |
 * | Internal Review         | Waiting Review                                   |
 * | Sent                    | Ready → Sent (Ready = approved to send)          |
 * | Client Feedback         | Opened                                           |
 * | Revision                | Negotiation                                      |
 * | Approved                | Approved                                         |
 * | Rejected                | Rejected                                         |
 * | Deposit Received        | Deposit Received                                 |
 * | Converted to Project    | Converted                                        |
 *
 * Transitions stamp `statusTimestamps[approvalStatus]`.
 * Convert requires Approved + Deposit Received (or explicit convert when both met).
 */

import type { ClientSegment } from "@/lib/clients/types";

export const PIPELINE_STAGES = [
  "New Inquiry",
  "Discovery",
  "Draft",
  "Internal Review",
  "Sent",
  "Client Feedback",
  "Revision",
  "Approved",
  "Rejected",
  "Deposit Received",
  "Converted to Project",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const APPROVAL_STATUSES = [
  "Draft",
  "Waiting Review",
  "Ready",
  "Sent",
  "Opened",
  "Negotiation",
  "Approved",
  "Rejected",
  "Deposit Received",
  "Converted",
] as const;

export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

/** Default approval status for each pipeline column. */
export const PIPELINE_TO_APPROVAL: Record<PipelineStage, ApprovalStatus> = {
  "New Inquiry": "Draft",
  Discovery: "Draft",
  Draft: "Draft",
  "Internal Review": "Waiting Review",
  Sent: "Sent",
  "Client Feedback": "Opened",
  Revision: "Negotiation",
  Approved: "Approved",
  Rejected: "Rejected",
  "Deposit Received": "Deposit Received",
  "Converted to Project": "Converted",
};

/** Preferred pipeline column when setting an approval status directly. */
export const APPROVAL_TO_PIPELINE: Record<ApprovalStatus, PipelineStage> = {
  Draft: "Draft",
  "Waiting Review": "Internal Review",
  Ready: "Internal Review",
  Sent: "Sent",
  Opened: "Client Feedback",
  Negotiation: "Revision",
  Approved: "Approved",
  Rejected: "Rejected",
  "Deposit Received": "Deposit Received",
  Converted: "Converted to Project",
};

export interface QuotationLineItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
}

export interface QuotationPaymentPlanItem {
  id: string;
  label: string;
  percent: number;
  amount: number;
  dueLabel?: string;
}

export interface QuotationAttachment {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
}

export interface QuotationProjectInfo {
  title: string;
  location?: string;
  shootDate?: string;
  deliveryDate?: string;
  workspaceId?: string;
  categoryDetail?: string;
}

export interface QuotationTimeline {
  discoveryDate?: string;
  shootDate?: string;
  firstDeliveryDate?: string;
  finalDeliveryDate?: string;
  notes?: string;
}

export interface QuotationDiscount {
  type: "percent" | "fixed";
  value: number;
}

/** Snapshot of builder content for version history. */
export interface QuotationVersionSnapshot {
  projectInfo: QuotationProjectInfo;
  services: string[];
  items: QuotationLineItem[];
  optionalItems: QuotationLineItem[];
  discount: QuotationDiscount;
  taxRate: number;
  timeline: QuotationTimeline;
  deliverables: string[];
  paymentPlan: QuotationPaymentPlanItem[];
  terms: string;
  builderNotes: string;
  estimatedValue: number;
  notes: string;
}

export interface QuotationVersion {
  version: number;
  editedBy: string;
  editedAt: string;
  changeSummary: string;
  snapshot: QuotationVersionSnapshot;
}

export interface Quotation {
  id: string;
  number: string;
  clientId?: string;
  clientName: string;
  company?: string;
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  segment: ClientSegment;
  category: string;
  estimatedValue: number;
  probability: number;
  expectedClosingDate: string;
  assignedSales: string;
  pipelineStage: PipelineStage;
  approvalStatus: ApprovalStatus;
  /** ISO timestamps keyed by approval status when first entered. */
  statusTimestamps: Partial<Record<ApprovalStatus, string>>;
  lastActivity: string;
  notes: string;
  attachments: QuotationAttachment[];
  versions: QuotationVersion[];
  currentVersion: number;
  projectInfo: QuotationProjectInfo;
  services: string[];
  items: QuotationLineItem[];
  optionalItems: QuotationLineItem[];
  discount: QuotationDiscount;
  taxRate: number;
  timeline: QuotationTimeline;
  deliverables: string[];
  paymentPlan: QuotationPaymentPlanItem[];
  terms: string;
  builderNotes: string;
  convertedProjectId?: string;
  convertedOrderId?: string;
  convertedInvoiceId?: string;
  convertedPaymentId?: string;
  convertedClientId?: string;
  createdAt: string;
  updatedAt: string;
}

export type NewQuotationInput = {
  clientId?: string;
  clientName: string;
  company?: string;
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  segment: ClientSegment;
  category: string;
  estimatedValue?: number;
  probability?: number;
  expectedClosingDate?: string;
  assignedSales?: string;
  notes?: string;
  projectInfo?: Partial<QuotationProjectInfo>;
};

export interface QuotationConversionResult {
  quotationId: string;
  clientId: string;
  projectId: string;
  orderId: string;
  invoiceId: string;
  paymentId: string;
  journeyStage: string;
  /** Finance ledger event created for the deposit (when amount > 0). */
  financialEventId?: string;
}

export interface QuotationMetrics {
  pendingCount: number;
  waitingClientCount: number;
  waitingDepositCount: number;
  wonThisMonth: number;
  lostThisMonth: number;
  conversionRate: number | null;
  averageApprovalDays: number | null;
  pipelineValue: number;
  asOf: string;
}

export interface ClientQuotationStats {
  quotations: Quotation[];
  totalCount: number;
  wonCount: number;
  lostCount: number;
  winLossRatio: number | null;
  totalQuotationValue: number;
  averageProjectSize: number | null;
}
