/**
 * Heuristic classifier for Founder Chat → Brain workspaces.
 * NOT an AI API. Transparent keywords (EN + AR). Never creates ERP entities.
 */

import type { BrainWorkspace, MoneyKind } from "@/lib/brain/types";

export type HeuristicClassification = {
  workspace: BrainWorkspace;
  moneyKind: MoneyKind | null;
  confidence: number;
  reasons: string[];
  extractedAmount: number | null;
  extractedPhone: string | null;
  suggestedTitle: string | null;
};

const RULES: Array<{
  workspace: BrainWorkspace;
  moneyKind?: MoneyKind;
  keywords: string[];
  weight: number;
}> = [
  {
    workspace: "money_memory",
    moneyKind: "to_collect",
    keywords: [
      "owed",
      "owes",
      "collect",
      "rtm",
      "فلوس",
      "يستلم",
      "عليه فلوس",
      "مستحق",
      "to collect",
      "waiting money",
    ],
    weight: 3,
  },
  {
    workspace: "money_memory",
    moneyKind: "lent",
    keywords: ["lent", "loaned", "سلفت", "اديت", "سلفة لـ", "loan given"],
    weight: 3,
  },
  {
    workspace: "money_memory",
    moneyKind: "debt",
    keywords: ["borrowed", "i owe", "عليا", "مديون", "loan taken", "دين عليا"],
    weight: 3,
  },
  {
    workspace: "money_memory",
    moneyKind: "crew_advance",
    keywords: ["advance", "سلفة طاقم", "crew advance", "عهده"],
    weight: 3,
  },
  {
    workspace: "money_memory",
    moneyKind: "client_debt",
    keywords: ["client debt", "دين عميل", "client owes"],
    weight: 3,
  },
  {
    workspace: "potential_orders",
    keywords: [
      "potential",
      "lead",
      "quotation",
      "quote",
      "shoot?",
      "interested",
      "اوردر محتمل",
      "عرض سعر",
      "عايزين تصوروا",
      "negotiat",
    ],
    weight: 2.5,
  },
  {
    workspace: "client_notebook",
    keywords: [
      "client note",
      "relationship",
      "عميل",
      "notebook",
      "تعرفت",
      "note about",
    ],
    weight: 2,
  },
  {
    workspace: "reminders",
    keywords: [
      "remind",
      "reminder",
      "don't forget",
      "tomorrow",
      "due",
      "ذكرني",
      "تذكير",
      "متنساش",
      "بكرة",
    ],
    weight: 2.5,
  },
  {
    workspace: "meeting_notes",
    keywords: [
      "meeting",
      "call notes",
      "اجتماع",
      "مكالمة",
      "zoom",
      "debrief",
    ],
    weight: 2.5,
  },
  {
    workspace: "personal_decisions",
    keywords: [
      "decide",
      "decision",
      "should i",
      "اقرر",
      "قرار",
      "هل اعمل",
      "debating",
    ],
    weight: 2,
  },
  {
    workspace: "future_plans",
    keywords: [
      "plan",
      "roadmap",
      "future",
      "next year",
      "خطة",
      "المستقبل",
      "later we",
    ],
    weight: 2,
  },
  {
    workspace: "ideas",
    keywords: ["idea", "what if", "فكرة", "imagine", "brainstorm"],
    weight: 2,
  },
];

function extractAmount(text: string): number | null {
  const normalized = text.replace(/,/g, "");
  const egp = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:k|K|الف|ألف)?\s*(?:egp|جنيه|LE|£)?/i
  );
  if (!egp) return null;
  let n = Number(egp[1]);
  if (!Number.isFinite(n)) return null;
  const unit = egp[0].toLowerCase();
  if (unit.includes("k") || unit.includes("الف") || unit.includes("ألف")) {
    n *= 1000;
  }
  return n;
}

function extractPhone(text: string): string | null {
  const m = text.match(/(?:\+?2?0)?1[0125]\d{8}|\+?\d{10,14}/);
  return m ? m[0] : null;
}

function firstLineTitle(text: string): string | null {
  const line = text.trim().split(/\n/)[0]?.trim() ?? "";
  if (!line) return null;
  return line.length > 80 ? `${line.slice(0, 77)}…` : line;
}

/**
 * Classify free Founder text into a Brain workspace.
 * Low-confidence / no match → inbox (safe default).
 */
export function classifyBrainText(raw: string): HeuristicClassification {
  const text = raw.trim();
  const lower = text.toLowerCase();
  const scores = new Map<
    string,
    { workspace: BrainWorkspace; moneyKind: MoneyKind | null; score: number; reasons: string[] }
  >();

  for (const rule of RULES) {
    const hits = rule.keywords.filter((k) => lower.includes(k.toLowerCase()));
    if (hits.length === 0) continue;
    const key = `${rule.workspace}:${rule.moneyKind ?? ""}`;
    const prev = scores.get(key) ?? {
      workspace: rule.workspace,
      moneyKind: rule.moneyKind ?? null,
      score: 0,
      reasons: [] as string[],
    };
    prev.score += rule.weight * hits.length;
    prev.reasons.push(...hits.map((h) => `kw:${h}`));
    scores.set(key, prev);
  }

  let best: {
    workspace: BrainWorkspace;
    moneyKind: MoneyKind | null;
    score: number;
    reasons: string[];
  } | null = null;

  for (const s of scores.values()) {
    if (!best || s.score > best.score) best = s;
  }

  if (!best || best.score < 2) {
    return {
      workspace: "inbox",
      moneyKind: null,
      confidence: 0.35,
      reasons: ["default:inbox"],
      extractedAmount: extractAmount(text),
      extractedPhone: extractPhone(text),
      suggestedTitle: firstLineTitle(text),
    };
  }

  const confidence = Math.min(0.92, 0.45 + best.score * 0.08);
  return {
    workspace: best.workspace,
    moneyKind: best.moneyKind,
    confidence,
    reasons: best.reasons.slice(0, 6),
    extractedAmount: extractAmount(text),
    extractedPhone: extractPhone(text),
    suggestedTitle: firstLineTitle(text),
  };
}

export function formatClassificationReply(
  c: HeuristicClassification,
  locale: "en" | "ar" = "en"
): string {
  const ws = c.workspace.replace(/_/g, " ");
  if (locale === "ar") {
    return [
      `صنّفت ده كـ «${ws}» (تصنيف مبدئي — لسه مش AI).`,
      c.moneyKind ? `نوع فلوس: ${c.moneyKind}` : null,
      c.extractedAmount != null ? `مبلغ ملحوظ: ${c.extractedAmount}` : null,
      `اتحفظ في الدماغ فقط — مفيش أي إنشاء في الـ ERP.`,
      `الثقة التقريبية: ${Math.round(c.confidence * 100)}%`,
    ]
      .filter(Boolean)
      .join("\n");
  }
  return [
    `Filed under «${ws}» (heuristic — not AI yet).`,
    c.moneyKind ? `Money kind: ${c.moneyKind}` : null,
    c.extractedAmount != null ? `Noticed amount: ${c.extractedAmount}` : null,
    `Saved in Brain only — nothing created in ERP.`,
    `Approx. confidence: ${Math.round(c.confidence * 100)}%`,
  ]
    .filter(Boolean)
    .join("\n");
}
