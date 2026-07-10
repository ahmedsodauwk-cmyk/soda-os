export type {
  ApprovalStatus,
  ClientQuotationStats,
  NewQuotationInput,
  PipelineStage,
  Quotation,
  QuotationAttachment,
  QuotationConversionResult,
  QuotationDiscount,
  QuotationLineItem,
  QuotationMetrics,
  QuotationPaymentPlanItem,
  QuotationProjectInfo,
  QuotationTimeline,
  QuotationVersion,
  QuotationVersionSnapshot,
} from "@/lib/quotations/types";

export {
  APPROVAL_STATUSES,
  APPROVAL_TO_PIPELINE,
  PIPELINE_STAGES,
  PIPELINE_TO_APPROVAL,
} from "@/lib/quotations/types";

export {
  applyDiscount,
  applySnapshotToQuotation,
  canConvertQuotation,
  computeQuotationTotals,
  defaultTerms,
  diffSnapshotSummary,
  formatEgp,
  formatShortDate,
  generateLineId,
  generateQuotationNumber,
  lineItemsSubtotal,
  snapshotFromQuotation,
  syncApprovalFromPipeline,
  syncPipelineFromApproval,
} from "@/lib/quotations/utils";

export {
  computeQuotationMetrics,
  createQuotation,
  getClientQuotationStats,
  getQuotationById,
  getQuotations,
  getQuotationsByClient,
  getQuotationsByPipelineStage,
  markDepositReceived,
  moveQuotationStage,
  restoreQuotationVersion,
  searchQuotations,
  setQuotationApprovalStatus,
  updateQuotation,
} from "@/lib/quotations/repository";

export { convertQuotationToProject } from "@/lib/quotations/convert";
