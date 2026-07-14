/**
 * Heuristic classifier — thin compatibility wrapper over Intelligence Layer parser.
 * Prefer `@/lib/brain/intelligence` for new code.
 * NOT an AI API. Never creates ERP entities.
 */

import { parseBrainText } from "@/lib/brain/intelligence/parser";
import type { BrainWorkspace, MoneyKind } from "@/lib/brain/types";

export type HeuristicClassification = {
  workspace: BrainWorkspace;
  moneyKind: MoneyKind | null;
  confidence: number;
  reasons: string[];
  extractedAmount: number | null;
  extractedPhone: string | null;
  suggestedTitle: string | null;
  personLabel?: string | null;
  companyLabel?: string | null;
  moneyDirection?: string | null;
  founderSummaryAr?: string;
  founderSummaryEn?: string;
};

/**
 * Classify free Founder text into a Brain workspace.
 * Low-confidence / no match → inbox (safe default).
 */
export function classifyBrainText(raw: string): HeuristicClassification {
  const u = parseBrainText(raw);
  return {
    workspace: u.workspace,
    moneyKind: u.moneyKind,
    confidence: u.confidence,
    reasons: u.reasons,
    extractedAmount: u.amount,
    extractedPhone: u.phone,
    suggestedTitle: u.title,
    personLabel: u.personLabel,
    companyLabel: u.companyLabel,
    moneyDirection: u.moneyDirection,
    founderSummaryAr: u.founderSummaryAr,
    founderSummaryEn: u.founderSummaryEn,
  };
}

export function formatClassificationReply(
  c: HeuristicClassification,
  locale: "en" | "ar" = "en"
): string {
  if (locale === "ar" && c.founderSummaryAr) return c.founderSummaryAr;
  if (locale === "en" && c.founderSummaryEn) return c.founderSummaryEn;

  const ws = c.workspace.replace(/_/g, " ");
  if (locale === "ar") {
    return [
      `فاهم: مساحة «${ws}».`,
      c.moneyKind ? `نوع فلوس: ${c.moneyKind}` : null,
      c.extractedAmount != null ? `مبلغ: ${c.extractedAmount}` : null,
      `مفيش حفظ غير لما توافق — الدماغ فقط · مفيش ERP.`,
      `الثقة: ${Math.round(c.confidence * 100)}%`,
    ]
      .filter(Boolean)
      .join("\n");
  }
  return [
    `Understood: «${ws}».`,
    c.moneyKind ? `Money kind: ${c.moneyKind}` : null,
    c.extractedAmount != null ? `Amount: ${c.extractedAmount}` : null,
    `Nothing stored until you approve — Brain only · never ERP.`,
    `Confidence: ${Math.round(c.confidence * 100)}%`,
  ]
    .filter(Boolean)
    .join("\n");
}
