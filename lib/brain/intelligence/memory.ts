/**
 * Memory Engine — relate new notes to prior Brain entries.
 * NEVER auto-modifies existing entries. Suggestions only.
 */

import type { BrainEntry, BrainWorkspace } from "@/lib/brain/types";
import type {
  BrainUnderstanding,
  EntityTimeline,
  EntityTimelineEvent,
  RelatedMemory,
} from "@/lib/brain/intelligence/types";

const CONTEXT_WORKSPACES: BrainWorkspace[] = [
  "money_memory",
  "ideas",
  "client_notebook",
  "potential_orders",
  "meeting_notes",
  "reminders",
];

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

function labelsOf(e: BrainEntry): string[] {
  return [e.personLabel, e.companyLabel, e.clientLabel]
    .map(norm)
    .filter(Boolean);
}

function entityKeys(u: BrainUnderstanding): string[] {
  return [u.personLabel, u.companyLabel, u.clientLabel]
    .map(norm)
    .filter(Boolean);
}

function snippet(e: BrainEntry): string {
  const t = (e.title || e.body || e.rawText || "").trim();
  return t.length > 100 ? `${t.slice(0, 97)}…` : t;
}

function moneyOutstandingHint(entries: BrainEntry[]): number | null {
  let waiting = 0;
  let has = false;
  for (const e of entries) {
    if (e.workspace !== "money_memory") continue;
    if (e.status === "Collected" || e.status === "Cancelled" || e.status === "Resolved") {
      continue;
    }
    if (
      e.moneyKind === "to_collect" ||
      e.moneyKind === "client_debt" ||
      e.moneyKind === "lent"
    ) {
      if (e.amount != null) {
        waiting += e.amount;
        has = true;
      }
    }
    if (e.moneyKind === "crew_advance" || e.moneyKind === "debt") {
      // outflows — not counted as "waiting in"
    }
  }
  return has ? waiting : null;
}

function buildSuggestion(
  u: BrainUnderstanding,
  e: BrainEntry,
  overlap: string[]
): { ar: string; en: string } | null {
  const who = overlap[0] ?? e.companyLabel ?? e.personLabel ?? "هذا الطرف";

  if (
    u.workspace === "money_memory" &&
    e.workspace === "money_memory" &&
    e.amount != null &&
    u.amount != null &&
    (e.moneyKind === "to_collect" || e.moneyKind === "client_debt")
  ) {
    const remaining = Math.max(0, e.amount - u.amount);
    if (
      /دفع|دفعت|جزئي|partial|paid/i.test(u.rawText) ||
      remaining < e.amount
    ) {
      return {
        ar: `في سجل سابق لـ ${who} بمبلغ ${e.amount.toLocaleString("ar-EG")}. لو دي دفعة جزئية، المتبقي تقريبًا ${remaining.toLocaleString("ar-EG")} — موافق تحدث السجل؟ (مش هيتعدل لوحده)`,
        en: `Prior record for ${who} at ${e.amount.toLocaleString("en-EG")}. If this is a partial payment, ~${remaining.toLocaleString("en-EG")} may remain — update that entry? (never auto-changed)`,
      };
    }
    return {
      ar: `لـ ${who} في سجل فلوس سابق (${e.amount.toLocaleString("ar-EG")}). تحب أربطه أو أحدث الحالة؟`,
      en: `${who} already has a money record (${e.amount.toLocaleString("en-EG")}). Link or update status?`,
    };
  }

  if (overlap.length > 0) {
    return {
      ar: `فيه ملاحظة سابقة عن «${who}» في ${e.workspace.replace(/_/g, " ")}. راجعها لو حابب — مش هتتعدل تلقائي.`,
      en: `Earlier Brain note about “${who}” in ${e.workspace.replace(/_/g, " ")}. Review if useful — never auto-modified.`,
    };
  }

  return null;
}

/**
 * Find related Brain memories for a parsed understanding.
 * Soft suggestions only — Founder decides.
 */
export function findRelatedMemories(
  understanding: BrainUnderstanding,
  entries: BrainEntry[],
  limit = 8
): RelatedMemory[] {
  const keys = entityKeys(understanding);
  const rawLower = understanding.rawText.toLowerCase();
  const scored: RelatedMemory[] = [];

  for (const entry of entries) {
    if (entry.archivedAt) continue;
    if (!CONTEXT_WORKSPACES.includes(entry.workspace) && entry.workspace !== "inbox") {
      continue;
    }

    let score = 0;
    const matchReasons: string[] = [];
    const elabels = labelsOf(entry);

    for (const k of keys) {
      if (elabels.some((l) => l === k || l.includes(k) || k.includes(l))) {
        score += 5;
        matchReasons.push(`label:${k}`);
      }
      if (norm(entry.body).includes(k) || norm(entry.rawText).includes(k)) {
        score += 2;
        matchReasons.push(`body:${k}`);
      }
    }

    // Loose token overlap (company tokens in raw text)
    for (const l of elabels) {
      if (l.length >= 2 && rawLower.includes(l)) {
        score += 3;
        matchReasons.push(`raw_mentions:${l}`);
      }
    }

    if (
      understanding.workspace === entry.workspace &&
      understanding.workspace !== "inbox"
    ) {
      score += 0.5;
    }

    if (
      understanding.amount != null &&
      entry.amount != null &&
      Math.abs(understanding.amount - entry.amount) < 0.01
    ) {
      score += 1.5;
      matchReasons.push("amount:exact");
    }

    if (score < 2) continue;

    const suggestion = buildSuggestion(understanding, entry, keys);
    scored.push({
      entry,
      score,
      matchReasons: [...new Set(matchReasons)].slice(0, 6),
      suggestionAr: suggestion?.ar ?? null,
      suggestionEn: suggestion?.en ?? null,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/**
 * Aggregate simple entity timelines from Brain entries (and caller may merge history).
 */
export function buildEntityTimelines(
  understanding: BrainUnderstanding,
  entries: BrainEntry[],
  limitEntities = 3
): EntityTimeline[] {
  const keys = entityKeys(understanding);
  if (keys.length === 0) return [];

  const groups = new Map<
    string,
    { label: string; kind: EntityTimeline["labelKind"]; items: BrainEntry[] }
  >();

  for (const key of keys) {
    const kind: EntityTimeline["labelKind"] = understanding.companyLabel &&
      norm(understanding.companyLabel) === key
      ? "company"
      : understanding.clientLabel && norm(understanding.clientLabel) === key
        ? "client"
        : "person";
    const label =
      understanding.companyLabel && norm(understanding.companyLabel) === key
        ? understanding.companyLabel
        : understanding.personLabel && norm(understanding.personLabel) === key
          ? understanding.personLabel
          : understanding.clientLabel && norm(understanding.clientLabel) === key
            ? understanding.clientLabel
            : key;

    const items = entries.filter((e) => {
      if (e.archivedAt) return false;
      return labelsOf(e).some(
        (l) => l === key || l.includes(key) || key.includes(l)
      );
    });
    if (items.length === 0) continue;
    groups.set(key, { label, kind, items });
  }

  const timelines: EntityTimeline[] = [];
  for (const g of groups.values()) {
    const events: EntityTimelineEvent[] = g.items
      .slice()
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      .slice(0, 12)
      .map((e) => ({
        entryId: e.id,
        at: e.updatedAt || e.createdAt,
        workspace: e.workspace,
        title: e.title,
        amount: e.amount,
        status: e.status,
        snippet: snippet(e),
      }));

    timelines.push({
      label: g.label,
      labelKind: g.kind,
      events,
      moneyOutstandingHint: moneyOutstandingHint(g.items),
    });
  }

  return timelines.slice(0, limitEntities);
}
