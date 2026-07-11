import { getBusinessToday } from "@/lib/business/types";
import { createQuotationsDb } from "@/lib/quotations/db";
import {
  quotationToRow,
  rowToQuotation,
  type QuotationRow,
} from "@/lib/quotations/mappers";
import type {
  ApprovalStatus,
  ClientQuotationStats,
  NewQuotationInput,
  PipelineStage,
  Quotation,
  QuotationMetrics,
} from "@/lib/quotations/types";
import {
  APPROVAL_TO_PIPELINE,
  PIPELINE_TO_APPROVAL,
} from "@/lib/quotations/types";
import {
  applySnapshotToQuotation,
  canConvertQuotation,
  computeQuotationTotals,
  defaultTerms,
  diffSnapshotSummary,
  generateQuotationNumber,
  snapshotFromQuotation,
} from "@/lib/quotations/utils";
import { getProjectsByClient } from "@/lib/projects/repository";

let quotationsCache: Quotation[] = [];

function upsertCache(q: Quotation): void {
  quotationsCache = [q, ...quotationsCache.filter((x) => x.id !== q.id)];
}

export async function refreshQuotations(): Promise<Quotation[]> {
  const db = createQuotationsDb();
  const { data, error } = await db
    .from("quotations")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`Failed to load quotations: ${error.message}`);
  quotationsCache = ((data ?? []) as QuotationRow[]).map(rowToQuotation);
  return [...quotationsCache];
}

async function persistQuotation(q: Quotation): Promise<Quotation> {
  const db = createQuotationsDb();
  const { data, error } = await db
    .from("quotations")
    .upsert(quotationToRow(q), { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw new Error(`Failed to save quotation: ${error.message}`);
  const saved = rowToQuotation(data as QuotationRow);
  upsertCache(saved);
  return structuredClone(saved);
}


function nowIso(): string {
  return new Date().toISOString();
}

function stampStatus(
  timestamps: Quotation["statusTimestamps"],
  status: ApprovalStatus,
  at: string
): Quotation["statusTimestamps"] {
  if (timestamps[status]) return timestamps;
  return { ...timestamps, [status]: at };
}

export function getQuotations(): Quotation[] {
  return [...quotationsCache].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
}

export function getQuotationById(id: string): Quotation | undefined {
  return quotationsCache.find((q) => q.id === id || q.number === id);
}

export function getQuotationsByClient(clientId: string): Quotation[] {
  return quotationsCache.filter((q) => q.clientId === clientId);
}

export function getQuotationsByPipelineStage(
  stage: PipelineStage
): Quotation[] {
  return quotationsCache.filter((q) => q.pipelineStage === stage);
}

export async function createQuotation(input: NewQuotationInput): Promise<Quotation> {
  const createdAt = nowIso();
  const number = generateQuotationNumber(quotationsCache.length);
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `quot-${crypto.randomUUID()}`
      : `quot-${Date.now().toString(36)}`;

  const quotation: Quotation = {
    id,
    number,
    clientId: input.clientId,
    clientName: input.clientName.trim(),
    company: input.company?.trim(),
    contactName: input.contactName.trim(),
    contactPhone: input.contactPhone?.trim(),
    contactEmail: input.contactEmail?.trim(),
    segment: input.segment,
    category: input.category.trim() || "General",
    estimatedValue: input.estimatedValue ?? 0,
    probability: input.probability ?? 20,
    expectedClosingDate:
      input.expectedClosingDate ?? createdAt.slice(0, 10),
    assignedSales: input.assignedSales?.trim() || "Junior Soda",
    pipelineStage: "New Inquiry",
    approvalStatus: "Draft",
    statusTimestamps: { Draft: createdAt },
    lastActivity: createdAt,
    notes: input.notes?.trim() ?? "",
    attachments: [],
    currentVersion: 1,
    projectInfo: {
      title:
        input.projectInfo?.title?.trim() ||
        `${input.clientName.trim()} — ${input.category.trim() || "Project"}`,
      location: input.projectInfo?.location,
      shootDate: input.projectInfo?.shootDate,
      deliveryDate: input.projectInfo?.deliveryDate,
      workspaceId:
        input.projectInfo?.workspaceId ||
        (input.segment === "wedding" ? "weddings" : "commercial"),
      categoryDetail: input.projectInfo?.categoryDetail,
    },
    services: [],
    items: [],
    optionalItems: [],
    discount: { type: "percent", value: 0 },
    taxRate: input.segment === "wedding" ? 0 : 14,
    timeline: {},
    deliverables: [],
    paymentPlan: [],
    terms: defaultTerms(input.segment),
    builderNotes: "",
    versions: [],
    createdAt,
    updatedAt: createdAt,
  };

  quotation.versions.push({
    version: 1,
    editedBy: quotation.assignedSales,
    editedAt: createdAt,
    changeSummary: "Initial version created",
    snapshot: snapshotFromQuotation(quotation),
  });

  return persistQuotation(quotation);
}

export async function updateQuotation(
  id: string,
  patch: Partial<Quotation>,
  options?: { editedBy?: string; saveVersion?: boolean; changeSummary?: string }
): Promise<Quotation | undefined> {
  const index = quotationsCache.findIndex((q) => q.id === id);
  if (index < 0) return undefined;

  const current = quotationsCache[index]!;
  const prevSnapshot = snapshotFromQuotation(current);
  const updatedAt = nowIso();

  const next: Quotation = {
    ...current,
    ...patch,
    id: current.id,
    number: current.number,
    versions: current.versions,
    updatedAt,
    lastActivity: updatedAt,
  };

  // Keep pipeline / approval in sync when either side is patched
  if (patch.pipelineStage && !patch.approvalStatus) {
    next.approvalStatus = PIPELINE_TO_APPROVAL[patch.pipelineStage];
  }
  if (patch.approvalStatus && !patch.pipelineStage) {
    next.pipelineStage = APPROVAL_TO_PIPELINE[patch.approvalStatus];
  }

  if (patch.statusTimestamps) {
    next.statusTimestamps = patch.statusTimestamps;
  } else if (patch.approvalStatus || patch.pipelineStage) {
    next.statusTimestamps = stampStatus(
      next.statusTimestamps,
      next.approvalStatus,
      updatedAt
    );
  }

  // Recalculate estimated value from line items when items change
  if (patch.items) {
    const totals = computeQuotationTotals(next);
    if (totals.total > 0) {
      next.estimatedValue = totals.total;
    }
  }

  if (options?.saveVersion !== false) {
    const nextSnapshot = snapshotFromQuotation(next);
    const summary =
      options?.changeSummary ??
      diffSnapshotSummary(prevSnapshot, nextSnapshot);
    const versionNumber = current.currentVersion + 1;
    next.currentVersion = versionNumber;
    next.versions = [
      ...current.versions,
      {
        version: versionNumber,
        editedBy: options?.editedBy ?? next.assignedSales,
        editedAt: updatedAt,
        changeSummary: summary,
        snapshot: nextSnapshot,
      },
    ];
  }

  return persistQuotation(next);
}

/** Hard-delete a quotation from Supabase and the sync cache. */
export async function deleteQuotation(id: string): Promise<void> {
  const db = createQuotationsDb();
  const { error } = await db.from("quotations").delete().eq("id", id);
  if (error) {
    throw new Error(`Failed to delete quotation: ${error.message}`);
  }
  quotationsCache = quotationsCache.filter((q) => q.id !== id);
}

export async function moveQuotationStage(
  id: string,
  stage: PipelineStage,
  editedBy = "Junior Soda"
): Promise<Quotation | undefined> {
  const approvalStatus = PIPELINE_TO_APPROVAL[stage];
  return updateQuotation(
    id,
    { pipelineStage: stage, approvalStatus },
    {
      editedBy,
      saveVersion: false,
      changeSummary: `Moved to ${stage}`,
    }
  );
}

export async function setQuotationApprovalStatus(
  id: string,
  status: ApprovalStatus,
  editedBy = "Junior Soda"
): Promise<Quotation | undefined> {
  return updateQuotation(
    id,
    {
      approvalStatus: status,
      pipelineStage: APPROVAL_TO_PIPELINE[status],
    },
    {
      editedBy,
      saveVersion: false,
      changeSummary: `Status → ${status}`,
    }
  );
}

export async function restoreQuotationVersion(
  id: string,
  versionNumber: number,
  editedBy = "Junior Soda"
): Promise<Quotation | undefined> {
  const current = getQuotationById(id);
  if (!current) return undefined;
  const target = current.versions.find((v) => v.version === versionNumber);
  if (!target) return undefined;

  const restored = applySnapshotToQuotation(current, target.snapshot);
  return updateQuotation(
    id,
    {
      projectInfo: restored.projectInfo,
      services: restored.services,
      items: restored.items,
      optionalItems: restored.optionalItems,
      discount: restored.discount,
      taxRate: restored.taxRate,
      timeline: restored.timeline,
      deliverables: restored.deliverables,
      paymentPlan: restored.paymentPlan,
      terms: restored.terms,
      builderNotes: restored.builderNotes,
      estimatedValue: restored.estimatedValue,
      notes: restored.notes,
    },
    {
      editedBy,
      saveVersion: true,
      changeSummary: `Restored version ${versionNumber}`,
    }
  );
}

export async function markDepositReceived(
  id: string,
  editedBy = "Junior Soda"
): Promise<Quotation | undefined> {
  return setQuotationApprovalStatus(id, "Deposit Received", editedBy);
}

export { canConvertQuotation };

export function getClientQuotationStats(
  clientId: string
): ClientQuotationStats {
  const quotations = getQuotationsByClient(clientId);
  const won = quotations.filter(
    (q) =>
      q.approvalStatus === "Approved" ||
      q.approvalStatus === "Deposit Received" ||
      q.approvalStatus === "Converted"
  );
  const lost = quotations.filter((q) => q.approvalStatus === "Rejected");
  const decided = won.length + lost.length;
  const totalQuotationValue = quotations.reduce(
    (acc, q) => acc + (q.estimatedValue || 0),
    0
  );

  const projects = getProjectsByClient(clientId);
  const projectRevenues = projects
    .map((p) => p.revenue)
    .filter((n) => n > 0);
  const averageFromProjects =
    projectRevenues.length > 0
      ? projectRevenues.reduce((a, b) => a + b, 0) / projectRevenues.length
      : null;
  const averageFromQuotes =
    won.length > 0
      ? won.reduce((a, q) => a + q.estimatedValue, 0) / won.length
      : null;

  return {
    quotations,
    totalCount: quotations.length,
    wonCount: won.length,
    lostCount: lost.length,
    winLossRatio: decided > 0 ? won.length / decided : null,
    totalQuotationValue,
    averageProjectSize: averageFromProjects ?? averageFromQuotes,
  };
}

export function computeQuotationMetrics(
  asOf: string = getBusinessToday()
): QuotationMetrics {
  const all = getQuotations();
  const monthKey = asOf.slice(0, 7);

  const pendingStages: PipelineStage[] = [
    "New Inquiry",
    "Discovery",
    "Draft",
    "Internal Review",
  ];
  const waitingClientStages: PipelineStage[] = [
    "Sent",
    "Client Feedback",
    "Revision",
  ];

  const pendingCount = all.filter((q) =>
    pendingStages.includes(q.pipelineStage)
  ).length;
  const waitingClientCount = all.filter((q) =>
    waitingClientStages.includes(q.pipelineStage)
  ).length;
  const waitingDepositCount = all.filter(
    (q) => q.pipelineStage === "Approved"
  ).length;

  const wonThisMonth = all.filter((q) => {
    const ts =
      q.statusTimestamps.Approved ??
      q.statusTimestamps["Deposit Received"] ??
      q.statusTimestamps.Converted;
    return ts != null && ts.slice(0, 7) === monthKey;
  }).length;

  const lostThisMonth = all.filter((q) => {
    const ts = q.statusTimestamps.Rejected;
    return ts != null && ts.slice(0, 7) === monthKey;
  }).length;

  const converted = all.filter((q) => q.approvalStatus === "Converted");
  const decided = all.filter(
    (q) =>
      q.approvalStatus === "Converted" ||
      q.approvalStatus === "Rejected" ||
      q.approvalStatus === "Approved" ||
      q.approvalStatus === "Deposit Received"
  );
  const conversionRate =
    decided.length > 0
      ? Math.round((converted.length / decided.length) * 100)
      : null;

  const approvalDurations: number[] = [];
  for (const q of all) {
    const draft = q.statusTimestamps.Draft;
    const approved = q.statusTimestamps.Approved;
    if (!draft || !approved) continue;
    const days =
      (new Date(approved).getTime() - new Date(draft).getTime()) /
      (1000 * 60 * 60 * 24);
    if (days >= 0) approvalDurations.push(days);
  }
  const averageApprovalDays =
    approvalDurations.length > 0
      ? Math.round(
          (approvalDurations.reduce((a, b) => a + b, 0) /
            approvalDurations.length) *
            10
        ) / 10
      : null;

  const openPipeline = all.filter(
    (q) =>
      q.pipelineStage !== "Rejected" &&
      q.pipelineStage !== "Converted to Project"
  );
  const pipelineValue = openPipeline.reduce(
    (acc, q) => acc + (q.estimatedValue || 0) * ((q.probability || 0) / 100),
    0
  );

  return {
    pendingCount,
    waitingClientCount,
    waitingDepositCount,
    wonThisMonth,
    lostThisMonth,
    conversionRate,
    averageApprovalDays,
    pipelineValue: Math.round(pipelineValue),
    asOf,
  };
}

export function searchQuotations(query: string): Quotation[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return getQuotations().filter((item) => {
    const hay = [
      item.number,
      item.clientName,
      item.company,
      item.contactName,
      item.category,
      item.assignedSales,
      item.pipelineStage,
      item.approvalStatus,
      item.projectInfo.title,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}
