import type {
  ApprovalStatus,
  PipelineStage,
  Quotation,
  QuotationAttachment,
  QuotationDiscount,
  QuotationLineItem,
  QuotationPaymentPlanItem,
  QuotationProjectInfo,
  QuotationTimeline,
  QuotationVersion,
} from "@/lib/quotations/types";
import type { ClientSegment } from "@/lib/clients/types";

export type QuotationRow = {
  id: string;
  number: string;
  client_id: string | null;
  client_name: string;
  company: string | null;
  contact_name: string;
  contact_phone: string | null;
  contact_email: string | null;
  segment: string;
  category: string;
  estimated_value: number | string;
  probability: number | string;
  expected_closing_date: string | null;
  assigned_sales: string;
  pipeline_stage: string;
  approval_status: string;
  status_timestamps: unknown;
  last_activity: string;
  notes: string;
  attachments: unknown;
  versions: unknown;
  current_version: number;
  project_info: unknown;
  services: unknown;
  items: unknown;
  optional_items: unknown;
  discount: unknown;
  tax_rate: number | string;
  timeline: unknown;
  deliverables: unknown;
  payment_plan: unknown;
  terms: string;
  builder_notes: string;
  converted_project_id: string | null;
  converted_order_id: string | null;
  converted_invoice_id: string | null;
  converted_payment_id: string | null;
  converted_client_id: string | null;
  created_at: string;
  updated_at: string;
};

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export function rowToQuotation(row: QuotationRow): Quotation {
  return {
    id: row.id,
    number: row.number,
    ...(row.client_id ? { clientId: row.client_id } : {}),
    clientName: row.client_name,
    ...(row.company ? { company: row.company } : {}),
    contactName: row.contact_name,
    ...(row.contact_phone ? { contactPhone: row.contact_phone } : {}),
    ...(row.contact_email ? { contactEmail: row.contact_email } : {}),
    segment: row.segment as ClientSegment,
    category: row.category,
    estimatedValue: Number(row.estimated_value) || 0,
    probability: Number(row.probability) || 0,
    expectedClosingDate: row.expected_closing_date ?? "",
    assignedSales: row.assigned_sales,
    pipelineStage: row.pipeline_stage as PipelineStage,
    approvalStatus: row.approval_status as ApprovalStatus,
    statusTimestamps:
      (row.status_timestamps as Quotation["statusTimestamps"]) ?? {},
    lastActivity: row.last_activity,
    notes: row.notes ?? "",
    attachments: asArray<QuotationAttachment>(row.attachments),
    versions: asArray<QuotationVersion>(row.versions),
    currentVersion: row.current_version ?? 1,
    projectInfo: (row.project_info as QuotationProjectInfo) ?? { title: "" },
    services: asArray<string>(row.services),
    items: asArray<QuotationLineItem>(row.items),
    optionalItems: asArray<QuotationLineItem>(row.optional_items),
    discount: (row.discount as QuotationDiscount) ?? {
      type: "percent",
      value: 0,
    },
    taxRate: Number(row.tax_rate) || 0,
    timeline: (row.timeline as QuotationTimeline) ?? {},
    deliverables: asArray<string>(row.deliverables),
    paymentPlan: asArray<QuotationPaymentPlanItem>(row.payment_plan),
    terms: row.terms ?? "",
    builderNotes: row.builder_notes ?? "",
    ...(row.converted_project_id
      ? { convertedProjectId: row.converted_project_id }
      : {}),
    ...(row.converted_order_id
      ? { convertedOrderId: row.converted_order_id }
      : {}),
    ...(row.converted_invoice_id
      ? { convertedInvoiceId: row.converted_invoice_id }
      : {}),
    ...(row.converted_payment_id
      ? { convertedPaymentId: row.converted_payment_id }
      : {}),
    ...(row.converted_client_id
      ? { convertedClientId: row.converted_client_id }
      : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function quotationToRow(q: Quotation): Record<string, unknown> {
  return {
    id: q.id,
    number: q.number,
    client_id: q.clientId ?? null,
    client_name: q.clientName,
    company: q.company ?? null,
    contact_name: q.contactName,
    contact_phone: q.contactPhone ?? null,
    contact_email: q.contactEmail ?? null,
    segment: q.segment,
    category: q.category,
    estimated_value: q.estimatedValue,
    probability: q.probability,
    expected_closing_date: q.expectedClosingDate || null,
    assigned_sales: q.assignedSales,
    pipeline_stage: q.pipelineStage,
    approval_status: q.approvalStatus,
    status_timestamps: q.statusTimestamps,
    last_activity: q.lastActivity,
    notes: q.notes,
    attachments: q.attachments,
    versions: q.versions,
    current_version: q.currentVersion,
    project_info: q.projectInfo,
    services: q.services,
    items: q.items,
    optional_items: q.optionalItems,
    discount: q.discount,
    tax_rate: q.taxRate,
    timeline: q.timeline,
    deliverables: q.deliverables,
    payment_plan: q.paymentPlan,
    terms: q.terms,
    builder_notes: q.builderNotes,
    converted_project_id: q.convertedProjectId ?? null,
    converted_order_id: q.convertedOrderId ?? null,
    converted_invoice_id: q.convertedInvoiceId ?? null,
    converted_payment_id: q.convertedPaymentId ?? null,
    converted_client_id: q.convertedClientId ?? null,
    created_at: q.createdAt,
    updated_at: q.updatedAt,
  };
}
