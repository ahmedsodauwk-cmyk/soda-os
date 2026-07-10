import type {
  ApprovalStatus,
  PipelineStage,
  Quotation,
  QuotationDiscount,
  QuotationLineItem,
  QuotationVersionSnapshot,
} from "@/lib/quotations/types";
import {
  APPROVAL_TO_PIPELINE,
  PIPELINE_TO_APPROVAL,
} from "@/lib/quotations/types";

export function lineItemsSubtotal(items: QuotationLineItem[]): number {
  return items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
}

export function applyDiscount(
  subtotal: number,
  discount: QuotationDiscount
): number {
  if (discount.value <= 0) return subtotal;
  if (discount.type === "percent") {
    return Math.max(0, subtotal - (subtotal * discount.value) / 100);
  }
  return Math.max(0, subtotal - discount.value);
}

export function computeQuotationTotals(q: Pick<
  Quotation,
  "items" | "discount" | "taxRate"
>): {
  subtotal: number;
  afterDiscount: number;
  tax: number;
  total: number;
} {
  const subtotal = lineItemsSubtotal(q.items);
  const afterDiscount = applyDiscount(subtotal, q.discount);
  const tax = Math.round((afterDiscount * (q.taxRate || 0)) / 100);
  const total = afterDiscount + tax;
  return { subtotal, afterDiscount, tax, total };
}

export function snapshotFromQuotation(q: Quotation): QuotationVersionSnapshot {
  return {
    projectInfo: structuredClone(q.projectInfo),
    services: [...q.services],
    items: structuredClone(q.items),
    optionalItems: structuredClone(q.optionalItems),
    discount: { ...q.discount },
    taxRate: q.taxRate,
    timeline: { ...q.timeline },
    deliverables: [...q.deliverables],
    paymentPlan: structuredClone(q.paymentPlan),
    terms: q.terms,
    builderNotes: q.builderNotes,
    estimatedValue: q.estimatedValue,
    notes: q.notes,
  };
}

export function applySnapshotToQuotation(
  q: Quotation,
  snapshot: QuotationVersionSnapshot
): Quotation {
  return {
    ...q,
    projectInfo: structuredClone(snapshot.projectInfo),
    services: [...snapshot.services],
    items: structuredClone(snapshot.items),
    optionalItems: structuredClone(snapshot.optionalItems),
    discount: { ...snapshot.discount },
    taxRate: snapshot.taxRate,
    timeline: { ...snapshot.timeline },
    deliverables: [...snapshot.deliverables],
    paymentPlan: structuredClone(snapshot.paymentPlan),
    terms: snapshot.terms,
    builderNotes: snapshot.builderNotes,
    estimatedValue: snapshot.estimatedValue,
    notes: snapshot.notes,
  };
}

export function syncApprovalFromPipeline(
  stage: PipelineStage
): ApprovalStatus {
  return PIPELINE_TO_APPROVAL[stage];
}

export function syncPipelineFromApproval(
  status: ApprovalStatus
): PipelineStage {
  return APPROVAL_TO_PIPELINE[status];
}

export function canConvertQuotation(q: Quotation): boolean {
  if (q.approvalStatus === "Converted" || q.convertedProjectId) return false;
  const approved =
    q.approvalStatus === "Approved" ||
    q.approvalStatus === "Deposit Received" ||
    Boolean(q.statusTimestamps.Approved);
  const deposit =
    q.approvalStatus === "Deposit Received" ||
    Boolean(q.statusTimestamps["Deposit Received"]);
  return approved && deposit;
}

export function formatEgp(amount: number): string {
  return `${Math.round(amount).toLocaleString("en-EG")} EGP`;
}

export function formatShortDate(iso: string): string {
  if (!iso) return "—";
  const day = iso.slice(0, 10);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${day}T12:00:00Z`));
}

export function generateQuotationNumber(existingCount: number): string {
  return `QT-2026-${String(existingCount + 1).padStart(4, "0")}`;
}

export function generateLineId(prefix = "li"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function defaultTerms(segment: "commercial" | "wedding"): string {
  if (segment === "wedding") {
    return [
      "Quotation valid for 14 days from issue date.",
      "Deposit confirms the shoot date and reserves the crew.",
      "Remaining balance due before final delivery.",
      "Travel outside Greater Cairo may incur additional fees.",
      "Raw files are not included unless listed as a line item.",
    ].join("\n");
  }
  return [
    "Quotation valid for 21 days from issue date.",
    "Work begins after signed approval and deposit receipt.",
    "Usage rights limited to the scope described in deliverables.",
    "Revisions beyond the included rounds are billed separately.",
    "Payment terms as stated in the payment plan.",
  ].join("\n");
}

export function diffSnapshotSummary(
  prev: QuotationVersionSnapshot | null,
  next: QuotationVersionSnapshot
): string {
  if (!prev) return "Initial version created";
  const changes: string[] = [];
  if (prev.estimatedValue !== next.estimatedValue) {
    changes.push("estimated value");
  }
  if (prev.items.length !== next.items.length) {
    changes.push("line items");
  } else if (
    JSON.stringify(prev.items) !== JSON.stringify(next.items)
  ) {
    changes.push("line item pricing");
  }
  if (JSON.stringify(prev.optionalItems) !== JSON.stringify(next.optionalItems)) {
    changes.push("optional items");
  }
  if (prev.discount.value !== next.discount.value || prev.discount.type !== next.discount.type) {
    changes.push("discount");
  }
  if (prev.taxRate !== next.taxRate) changes.push("tax");
  if (prev.terms !== next.terms) changes.push("terms");
  if (JSON.stringify(prev.paymentPlan) !== JSON.stringify(next.paymentPlan)) {
    changes.push("payment plan");
  }
  if (JSON.stringify(prev.deliverables) !== JSON.stringify(next.deliverables)) {
    changes.push("deliverables");
  }
  if (prev.projectInfo.title !== next.projectInfo.title) {
    changes.push("project title");
  }
  if (changes.length === 0) return "Minor edits";
  return `Updated ${changes.join(", ")}`;
}
