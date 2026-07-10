/**
 * Convert an approved quotation (with deposit) into the SODA OS business graph:
 * Client → Project → Order → Journey → Invoice → Payment → crew assignment stubs.
 */

import { BUSINESS_TODAY } from "@/lib/business/types";
import { mockClients } from "@/lib/clients/mock-data";
import type { Client } from "@/lib/clients/types";
import { mockInvoices } from "@/lib/invoices/seed";
import type { Invoice } from "@/lib/invoices/types";
import { PROJECT_JOURNEY_STAGES } from "@/lib/journey/seed";
import type { JourneyStage } from "@/lib/journey/types";
import { mockOrders } from "@/lib/orders/mock-data";
import type { Order, ProjectType } from "@/lib/orders/types";
import { generateOrderId } from "@/lib/orders/utils";
import { mockPayments } from "@/lib/payments/mock-data";
import type { Payment } from "@/lib/payments/types";
import { mockProjects } from "@/lib/projects/mock-data";
import type { Project, ProjectTeamMember } from "@/lib/projects/types";
import {
  canConvertQuotation,
  getQuotationById,
  updateQuotation,
} from "@/lib/quotations/repository";
import type {
  Quotation,
  QuotationConversionResult,
} from "@/lib/quotations/types";
import { computeQuotationTotals } from "@/lib/quotations/utils";

function emptyHub(): Pick<
  Project,
  | "overview"
  | "orders"
  | "calendar"
  | "files"
  | "payments"
  | "timeline"
  | "notes"
  | "activity"
  | "deliverables"
> {
  return {
    overview: {
      summary: "",
      milestones: [],
      nextAction: "",
    },
    orders: [],
    calendar: [],
    files: [],
    payments: [],
    timeline: [],
    notes: [],
    activity: [],
    deliverables: [],
  };
}

function resolveOrCreateClient(q: Quotation, now: string): Client {
  if (q.clientId) {
    const existing = mockClients.find((c) => c.id === q.clientId);
    if (existing) return existing;
  }

  const byName = mockClients.find(
    (c) =>
      c.name.toLowerCase() === q.clientName.trim().toLowerCase() ||
      (q.company &&
        c.company?.toLowerCase() === q.company.trim().toLowerCase())
  );
  if (byName) return byName;

  const client: Client = {
    id: `client-${String(mockClients.length + 1).padStart(3, "0")}`,
    type: q.segment === "commercial" ? "company" : "individual",
    segment: q.segment,
    name: q.clientName.trim(),
    phone: q.contactPhone ?? "",
    email: q.contactEmail,
    contactPerson: q.contactName,
    company: q.company ?? (q.segment === "commercial" ? q.clientName : undefined),
    notes: `Created from quotation ${q.number}`,
    createdAt: now,
    isActive: true,
  };
  mockClients.unshift(client);
  return client;
}

function projectTypeFromQuotation(q: Quotation): ProjectType {
  if (q.segment === "wedding") {
    const cat = q.category.toLowerCase();
    if (cat.includes("engagement")) return "Engagement";
    return "Wedding";
  }
  const cat = q.category.toLowerCase();
  if (cat.includes("product") || cat.includes("pack")) return "Product";
  if (cat.includes("event") || cat.includes("summit") || cat.includes("runway"))
    return "Event";
  if (cat.includes("fashion") || cat.includes("beauty") || cat.includes("portrait"))
    return "Portrait";
  return "Commercial";
}

function workspaceFromQuotation(q: Quotation): string {
  if (q.projectInfo.workspaceId) return q.projectInfo.workspaceId;
  return q.segment === "wedding" ? "weddings" : "commercial";
}

function depositAmount(q: Quotation, total: number): number {
  const depositPlan = q.paymentPlan.find((p) =>
    p.label.toLowerCase().includes("deposit")
  );
  if (depositPlan && depositPlan.amount > 0) return depositPlan.amount;
  return Math.round(total * 0.4);
}

/**
 * Convert quotation → linked business entities.
 * Requires Approved + Deposit Received (or already at Deposit Received).
 */
export function convertQuotationToProject(
  quotationId: string,
  options?: { editedBy?: string; force?: boolean }
): QuotationConversionResult {
  const quotation = getQuotationById(quotationId);
  if (!quotation) {
    throw new Error(`Quotation not found: ${quotationId}`);
  }
  if (quotation.convertedProjectId) {
    throw new Error(`Quotation ${quotation.number} is already converted`);
  }
  if (!options?.force && !canConvertQuotation(quotation)) {
    throw new Error(
      "Convert requires Approved and Deposit Received statuses"
    );
  }

  const now = new Date().toISOString();
  const today = BUSINESS_TODAY;
  const totals = computeQuotationTotals(quotation);
  const total =
    totals.total > 0 ? totals.total : quotation.estimatedValue || 0;
  const deposit = depositAmount(quotation, total);
  const client = resolveOrCreateClient(quotation, now);
  const projectType = projectTypeFromQuotation(quotation);
  const workspaceId = workspaceFromQuotation(quotation);
  const journeyStage: JourneyStage = "PreProduction";

  const projectId = `PRJ-2026-${String(mockProjects.length + 1).padStart(4, "0")}`;
  const orderId = generateOrderId(mockOrders.length);
  const invoiceId = `inv-${String(mockInvoices.length + 1).padStart(3, "0")}`;
  const paymentId = `pay-${orderId.toLowerCase()}-deposit`;
  const shootDate =
    quotation.projectInfo.shootDate ||
    quotation.timeline.shootDate ||
    today;
  const deliveryDate =
    quotation.projectInfo.deliveryDate ||
    quotation.timeline.finalDeliveryDate ||
    today;

  const crewPlaceholders: ProjectTeamMember[] =
    quotation.segment === "wedding"
      ? [
          {
            id: `crew-${projectId}-photo`,
            name: "TBD Photographer",
            role: "Lead Photographer",
            initials: "PH",
          },
          {
            id: `crew-${projectId}-video`,
            name: "TBD Videographer",
            role: "Videographer",
            initials: "VD",
          },
        ]
      : [
          {
            id: `crew-${projectId}-lead`,
            name: "TBD Lead",
            role: "Lead Photographer",
            initials: "LD",
          },
          {
            id: `crew-${projectId}-prod`,
            name: "TBD Producer",
            role: "Producer",
            initials: "PR",
          },
        ];

  const project: Project = {
    id: projectId,
    name: quotation.projectInfo.title || `${quotation.clientName} — ${quotation.category}`,
    workspaceId,
    clientName: client.name,
    clientId: client.id,
    status: "Active",
    journeyStage,
    progress: 0,
    ordersCount: 0,
    revenue: 0,
    team: crewPlaceholders,
    upcomingShoots: [],
    lastActivity: now,
    description: quotation.notes || quotation.builderNotes,
    createdAt: now,
    updatedAt: now,
    isActive: true,
    ...emptyHub(),
    overview: {
      summary: `Converted from ${quotation.number}`,
      milestones: quotation.deliverables.slice(0, 4),
      nextAction: "Confirm shoot logistics and crew",
    },
    timeline: [
      {
        id: `tl-${projectId}-convert`,
        title: "Converted from quotation",
        description: `${quotation.number} → project`,
        date: today,
        type: "milestone",
      },
      ...(shootDate
        ? [
            {
              id: `tl-${projectId}-shoot`,
              title: "Scheduled shoot",
              description: shootDate,
              date: shootDate,
              type: "shoot",
            },
          ]
        : []),
      ...(deliveryDate
        ? [
            {
              id: `tl-${projectId}-delivery`,
              title: "Delivery deadline",
              description: deliveryDate,
              date: deliveryDate,
              type: "delivery",
            },
          ]
        : []),
    ],
    deliverables: quotation.deliverables.map((name, i) => ({
      id: `pd-${projectId}-${i}`,
      name,
      status: "pending" as const,
      dueDate: deliveryDate,
    })),
    payments: [
      {
        id: `pp-${projectId}-deposit`,
        label: "Deposit",
        amount: deposit,
        kind: "deposit",
        status: "paid",
        paidAt: today,
      },
      {
        id: `pp-${projectId}-balance`,
        label: "Balance",
        amount: Math.max(0, total - deposit),
        kind: "final",
        status: "pending",
      },
    ],
    calendar: shootDate
      ? [
          {
            id: `cal-${projectId}-shoot`,
            title: "Shoot",
            startsAt: `${shootDate}T09:00:00Z`,
            kind: "shoot",
            location: quotation.projectInfo.location,
          },
        ]
      : [],
    activity: [
      {
        id: `act-${projectId}-1`,
        actor: options?.editedBy ?? "Junior Soda",
        action: `Created from quotation ${quotation.number}`,
        createdAt: now,
      },
    ],
    notes: quotation.notes
      ? [
          {
            id: `note-${projectId}-1`,
            author: options?.editedBy ?? "Junior Soda",
            body: quotation.notes,
            createdAt: now,
          },
        ]
      : [],
  };

  mockProjects.unshift(project);
  PROJECT_JOURNEY_STAGES[projectId] = journeyStage;

  const order: Order = {
    id: orderId,
    projectId,
    clientId: client.id,
    clientName: client.name,
    phone: client.phone || quotation.contactPhone || "",
    projectType,
    workspaceId,
    shootDate,
    location: quotation.projectInfo.location || "TBD",
    deliveryDate,
    price: total,
    deposit,
    team:
      quotation.segment === "wedding" ? "Wedding Squad" : "Commercial Team",
    status: "Scheduled",
    notes: `From ${quotation.number}. ${quotation.notes}`.trim(),
  };
  mockOrders.unshift(order);

  const invoice: Invoice = {
    id: invoiceId,
    clientId: client.id,
    projectId,
    orderId,
    number: `INV-2026-${String(mockInvoices.length + 1).padStart(4, "0")}`,
    issueDate: today,
    dueDate: deliveryDate,
    amount: total,
    paidAmount: deposit,
    status: deposit >= total ? "paid" : "partial",
    periodMonth: today.slice(0, 7),
    notes: `Deposit invoice from quotation ${quotation.number}`,
  };
  mockInvoices.unshift(invoice);

  const payment: Payment = {
    id: paymentId,
    orderId,
    projectId,
    clientId: client.id,
    workspaceId,
    amount: deposit,
    currency: "EGP",
    kind: "deposit",
    status: "paid",
    paidAt: today,
    label: `Deposit — ${quotation.number}`,
    note: `Converted from ${quotation.number}`,
  };
  mockPayments.unshift(payment);

  updateQuotation(
    quotation.id,
    {
      clientId: client.id,
      pipelineStage: "Converted to Project",
      approvalStatus: "Converted",
      convertedProjectId: projectId,
      convertedOrderId: orderId,
      convertedInvoiceId: invoiceId,
      convertedPaymentId: paymentId,
      convertedClientId: client.id,
      statusTimestamps: {
        ...quotation.statusTimestamps,
        Approved: quotation.statusTimestamps.Approved ?? now,
        "Deposit Received":
          quotation.statusTimestamps["Deposit Received"] ?? now,
        Converted: now,
      },
    },
    {
      editedBy: options?.editedBy ?? "Junior Soda",
      saveVersion: true,
      changeSummary: `Converted to project ${projectId}`,
    }
  );

  return {
    quotationId: quotation.id,
    clientId: client.id,
    projectId,
    orderId,
    invoiceId,
    paymentId,
    journeyStage,
  };
}
