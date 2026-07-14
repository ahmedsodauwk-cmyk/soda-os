/**
 * Intelligence pipeline orchestrator (parse → memory → context → ops enrich).
 * Pure functions over in-memory Brain entries. Persistence is Founder-gated.
 */

import type { BrainEntry } from "@/lib/brain/types";
import { buildEntityTimelines, findRelatedMemories } from "@/lib/brain/intelligence/memory";
import {
  buildEntities,
  enrichOperationsUnderstanding,
} from "@/lib/brain/intelligence/ops-enrich";
import { parseBrainText } from "@/lib/brain/intelligence/parser";
import {
  buildPotentialActions,
  canApproveDraft,
  computeMissingFields,
  nextSmartQuestion,
} from "@/lib/brain/intelligence/questions";
import { refreshUnderstandingSummaries } from "@/lib/brain/intelligence/summary";
import type {
  BrainUnderstanding,
  ErpAwarenessHit,
  IntelligenceParseResult,
  UnderstandingEdits,
} from "@/lib/brain/intelligence/types";

export function runIntelligencePipeline(
  rawText: string,
  entries: BrainEntry[],
  options?: { erpAwareness?: ErpAwarenessHit[] }
): IntelligenceParseResult {
  let understanding = parseBrainText(rawText);
  if (options?.erpAwareness?.length) {
    understanding = refreshUnderstandingSummaries({
      ...understanding,
      erpAwareness: options.erpAwareness,
    });
  }
  const related = findRelatedMemories(understanding, entries);
  const timelines = buildEntityTimelines(understanding, entries);

  const suggestions: string[] = [];
  for (const r of related) {
    if (r.suggestionAr) suggestions.push(r.suggestionAr);
  }
  for (const hit of understanding.erpAwareness) {
    suggestions.push(hit.noteAr);
  }
  const unique = [...new Set(suggestions)].slice(0, 6);

  return {
    understanding,
    related,
    timelines,
    suggestions: unique,
  };
}

export function applyUnderstandingEdits(
  base: BrainUnderstanding,
  edits: UnderstandingEdits
): BrainUnderstanding {
  const nextBase: BrainUnderstanding = {
    ...base,
    ...edits,
    rawText: base.rawText,
    reasons: base.reasons,
    questionsAsked: base.questionsAsked,
    erpAwareness: base.erpAwareness,
    voice: base.voice,
    intelligenceProvider: "heuristic",
  };

  if (nextBase.workspace !== "money_memory") {
    if (edits.moneyKind === undefined) nextBase.moneyKind = null;
    if (edits.moneyDirection === undefined) nextBase.moneyDirection = null;
  }

  const enriched = enrichOperationsUnderstanding({
    ...nextBase,
    intent: edits.intent ?? nextBase.intent,
    executeTarget: edits.executeTarget ?? nextBase.executeTarget,
    lifecycle: edits.lifecycle ?? nextBase.lifecycle,
  });

  enriched.entities = buildEntities(enriched);
  enriched.missingFields = computeMissingFields(enriched);
  const nextQ = nextSmartQuestion(
    enriched.missingFields,
    enriched.questionsAsked
  );
  enriched.nextQuestionAr = nextQ?.ar ?? null;
  enriched.nextQuestionEn = nextQ?.en ?? null;
  enriched.potentialActions = buildPotentialActions(
    enriched.intent,
    enriched.executeTarget
  );
  enriched.canApprove = canApproveDraft(
    enriched.missingFields,
    enriched.confidence
  );

  // Approve lock: if Founder marked approved but fields became incomplete, revert.
  if (
    enriched.lifecycle === "approved" &&
    !enriched.canApprove
  ) {
    enriched.lifecycle = "draft";
  }

  return refreshUnderstandingSummaries(enriched);
}

/** Mark draft approved — Execute stays blocked until this. */
export function approveUnderstanding(
  u: BrainUnderstanding
): BrainUnderstanding {
  if (!u.canApprove) {
    return refreshUnderstandingSummaries({
      ...u,
      lifecycle: "draft",
    });
  }
  return refreshUnderstandingSummaries({
    ...u,
    lifecycle: "approved",
  });
}

/** Apply a follow-up answer to the active nextQuestion field. */
export function applyFollowUpAnswer(
  base: BrainUnderstanding,
  answer: string
): BrainUnderstanding {
  const field = base.missingFields[0];
  if (!field) {
    return applyUnderstandingEdits(base, {});
  }

  const trimmed = answer.trim();
  const asked = [...base.questionsAsked, field];
  const edits: UnderstandingEdits = {};

  switch (field) {
    case "personOrCompany":
    case "clientName":
      if (/[\u0600-\u06FF]/.test(trimmed) && trimmed.length <= 40) {
        edits.personLabel = trimmed;
        edits.clientLabel = trimmed;
      } else {
        edits.companyLabel = trimmed;
        edits.clientLabel = trimmed;
      }
      break;
    case "amount": {
      const n = Number(trimmed.replace(/,/g, "").replace(/[^\d.]/g, ""));
      if (Number.isFinite(n)) edits.amount = n;
      break;
    }
    case "moneyKind": {
      const lower = trimmed.toLowerCase();
      if (/مستحق|collect|waiting|ليا/.test(lower)) edits.moneyKind = "to_collect";
      else if (/سلفة طاقم|crew|عهده|عهدة/.test(lower))
        edits.moneyKind = "crew_advance";
      else if (/سلف|lent|loan/.test(lower)) edits.moneyKind = "lent";
      else if (/دين|عليا|debt|owe/.test(lower)) edits.moneyKind = "debt";
      else edits.moneyKind = "note";
      break;
    }
    case "phone":
      edits.phone = trimmed;
      break;
    case "shootDate":
      edits.shootDate = trimmed;
      break;
    case "projectType":
      edits.projectType = trimmed;
      break;
    case "title":
      edits.title = trimmed;
      break;
    default:
      break;
  }

  const next = applyUnderstandingEdits(
    { ...base, questionsAsked: asked },
    edits
  );
  return next;
}
