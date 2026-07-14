/**
 * Smart Parser — local heuristics (AR/EN).
 * Extracts workspace, money, people/companies, confidence.
 * NOT an AI API. Never writes ERP or Brain — parse only.
 * Operations Desk enrichment (intent / questions) happens in ops-enrich.
 */

import {
  defaultStatusForWorkspace,
  type BrainCurrency,
  type BrainWorkspace,
  type MoneyDirection,
  type MoneyKind,
} from "@/lib/brain/types";
import { enrichOperationsUnderstanding } from "@/lib/brain/intelligence/ops-enrich";
import { buildFounderSummary } from "@/lib/brain/intelligence/summary";
import type { BrainUnderstanding } from "@/lib/brain/intelligence/types";

type ScoreBucket = {
  workspace: BrainWorkspace;
  moneyKind: MoneyKind | null;
  score: number;
  reasons: string[];
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
      "waiting money",
      "to collect",
      "still owes",
      "فلوس",
      "يستلم",
      "عليه فلوس",
      "مستحق",
      "ليا عند",
      "عندي عند",
      "مستنيين",
      "هنستلم",
      "لسه عليه",
      "باقي عليه",
    ],
    weight: 3,
  },
  {
    workspace: "money_memory",
    moneyKind: "lent",
    keywords: [
      "lent",
      "loaned",
      "loan given",
      "سلفت",
      "اديت",
      "سلفة لـ",
      "اديتو",
      "اديتها",
      "اقرضت",
    ],
    weight: 3,
  },
  {
    workspace: "money_memory",
    moneyKind: "debt",
    keywords: [
      "borrowed",
      "i owe",
      "loan taken",
      "عليا",
      "مديون",
      "دين عليا",
      "مدين",
      "عليا فلوس",
    ],
    weight: 3,
  },
  {
    workspace: "money_memory",
    moneyKind: "crew_advance",
    keywords: [
      "advance",
      "crew advance",
      "سلفة طاقم",
      "عهده",
      "خد سلفة",
      "سلفة",
      "عهدة",
    ],
    weight: 3.2,
  },
  {
    workspace: "money_memory",
    moneyKind: "client_debt",
    keywords: [
      "client debt",
      "دين عميل",
      "client owes",
      "العميل مديون",
      "العميل عليه",
    ],
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
      "ممكن اوردر",
      "هيتصوروا",
      "budget تقريبا",
      "عاملين عرض",
      "احتمال ياخدوا",
    ],
    weight: 2.5,
  },
  {
    workspace: "client_notebook",
    keywords: [
      "ضيف عميل",
      "عميل جديد",
      "انشئ عميل",
      "أنشئ عميل",
      "create client",
      "new client",
      "add client",
    ],
    weight: 3.5,
  },
  {
    workspace: "potential_orders",
    keywords: [
      "اعمل اوردر",
      "اعمل أوردر",
      "اوردر جديد",
      "أوردر جديد",
      "create order",
      "new order",
      "book order",
    ],
    weight: 3.5,
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
      "ملاحظة عن",
      "ملاحظات عميل",
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
      "ماتنساش",
      "remind me",
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
      "اتقابلنا",
      "نوتس الاجتماع",
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
      "محتار",
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
      "هنعمل بعدين",
    ],
    weight: 2,
  },
  {
    workspace: "ideas",
    keywords: [
      "idea",
      "what if",
      "فكرة",
      "imagine",
      "brainstorm",
      "عندي فكرة",
    ],
    weight: 2,
  },
];

/** Known Egyptian production / brand tokens → company labels. */
const COMPANY_HINTS = [
  "rtm",
  "coca",
  "coca-cola",
  "pepsi",
  "nestle",
  "نسلي",
  "vodafone",
  "etisalat",
  "orange",
  "we",
  "uber",
  "careem",
  "jumia",
  "amazon",
  "noon",
  "talabat",
];

/** Common Arabic/English crew-ish first names used as soft person hints. */
const CREW_NAME_HINTS = [
  "نيمو",
  "nemo",
  "أحمد",
  "احمد",
  "ahmed",
  "محمد",
  "mohamed",
  "علي",
  "ali",
  "سارة",
  "sara",
  "عمر",
  "omar",
  "يوسف",
  "youssef",
  "كريم",
  "karim",
  "ياسر",
  "yasser",
  "هاني",
  "hany",
  "مينا",
  "mina",
  "بشوي",
  "bishoy",
];

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "this",
  "that",
  "have",
  "has",
  "was",
  "are",
  "عن",
  "من",
  "على",
  "عند",
  "ليا",
  "لسه",
  "فلوس",
  "ألف",
  "الف",
  "جنيه",
  "خد",
  "اديت",
  "سلفت",
  "فكرة",
  "تذكير",
  "ذكرني",
  "اجتماع",
  "قرار",
  "خطة",
  "عميل",
  "اوردر",
]);

export function extractAmount(text: string): number | null {
  const normalized = text.replace(/,/g, "");
  // Prefer explicit "120 ألف" / "5k" patterns
  const withUnit = normalized.match(
    /(\d+(?:\.\d+)?)\s*(k|K|الف|ألف)\b/
  );
  if (withUnit) {
    const n = Number(withUnit[1]);
    if (Number.isFinite(n)) return n * 1000;
  }
  const egp = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:egp|جنيه|LE|£|usd|\$)?/i
  );
  if (!egp) return null;
  const n = Number(egp[1]);
  return Number.isFinite(n) ? n : null;
}

export function extractCurrency(text: string): BrainCurrency | null {
  const lower = text.toLowerCase();
  if (/usd|\$|دولار/.test(lower)) return "USD";
  if (/eur|€|يورو/.test(lower)) return "EUR";
  if (/sar|ريال\s*سعودي/.test(lower)) return "SAR";
  if (/aed|درهم/.test(lower)) return "AED";
  if (/egp|جنيه|LE|£|ألف|الف|\d/.test(text)) return "EGP";
  return null;
}

export function extractPhone(text: string): string | null {
  const m = text.match(/(?:\+?2?0)?1[0125]\d{8}|\+?\d{10,14}/);
  return m ? m[0] : null;
}

function firstLineTitle(text: string): string | null {
  const line = text.trim().split(/\n/)[0]?.trim() ?? "";
  if (!line) return null;
  return line.length > 80 ? `${line.slice(0, 77)}…` : line;
}

const ACRONYM_COMPANIES = new Set([
  "rtm",
  "we",
  "usd",
  "egp",
]);

function formatCompanyHint(hint: string): string {
  if (ACRONYM_COMPANIES.has(hint.toLowerCase()) || hint.length <= 3) {
    return hint.toUpperCase();
  }
  return hint
    .split(/[\s-]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function extractCompanyLabel(text: string): string | null {
  const lower = text.toLowerCase();
  for (const hint of COMPANY_HINTS) {
    if (lower.includes(hint)) {
      return formatCompanyHint(hint);
    }
  }

  // "عند RTM" / "مع شركة X" / "for Acme"
  const arAt = text.match(
    /(?:عند|مع|لـ|ل)\s+([A-Za-z\u0600-\u06FF][A-Za-z0-9\u0600-\u06FF.&-]{1,40})/
  );
  if (arAt?.[1] && !STOP_WORDS.has(arAt[1].toLowerCase())) {
    const candidate = arAt[1].trim();
    if (!/^\d/.test(candidate)) return candidate;
  }

  const enFor = text.match(
    /\b(?:for|from|with|at)\s+([A-Z][A-Za-z0-9.&-]{1,40})\b/
  );
  if (enFor?.[1] && !STOP_WORDS.has(enFor[1].toLowerCase())) {
    return enFor[1];
  }

  return null;
}

function extractPersonLabel(
  text: string,
  moneyKind: MoneyKind | null
): string | null {
  const lower = text.toLowerCase();
  for (const name of CREW_NAME_HINTS) {
    if (lower.includes(name.toLowerCase())) {
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
  }

  // "نيمو خد 1000" / "Ahmed owes" / "سلفت محمد"
  const arVerb = text.match(
    /^([A-Za-z\u0600-\u06FF]{2,30})\s+(?:خد|اخد|أخذ|اخدت|سلف|اخد سلفة)/
  );
  if (arVerb?.[1] && !STOP_WORDS.has(arVerb[1].toLowerCase())) {
    return arVerb[1];
  }

  const lentTo = text.match(
    /(?:سلفت|اديت|اقرضت|lent|loaned)\s+([A-Za-z\u0600-\u06FF]{2,30})/i
  );
  if (lentTo?.[1] && !STOP_WORDS.has(lentTo[1].toLowerCase())) {
    return lentTo[1];
  }

  const enOwes = text.match(
    /\b([A-Z][a-z]{1,28})\s+(?:owes|owed)\b/
  );
  if (enOwes?.[1]) return enOwes[1];

  if (moneyKind === "crew_advance") {
    const first = text.trim().split(/\s+/)[0];
    if (
      first &&
      first.length >= 2 &&
      first.length <= 30 &&
      !STOP_WORDS.has(first.toLowerCase()) &&
      !/^\d/.test(first)
    ) {
      return first;
    }
  }

  return null;
}

function inferMoneyDirection(
  moneyKind: MoneyKind | null,
  text: string
): MoneyDirection | null {
  if (!moneyKind) return null;
  switch (moneyKind) {
    case "to_collect":
    case "client_debt":
    case "lent":
      return "in";
    case "debt":
    case "crew_advance":
      return "out";
    default: {
      const lower = text.toLowerCase();
      if (/خد|paid|دفعت|سلفة/.test(lower)) return "out";
      if (/ليا|هنستلم|collect|owed/.test(lower)) return "in";
      return "neutral";
    }
  }
}

/** Pattern boosters for mission examples. */
function applyPatternBoosts(
  text: string,
  lower: string,
  scores: Map<string, ScoreBucket>
): void {
  const bump = (
    workspace: BrainWorkspace,
    moneyKind: MoneyKind | null,
    points: number,
    reason: string
  ) => {
    const key = `${workspace}:${moneyKind ?? ""}`;
    const prev = scores.get(key) ?? {
      workspace,
      moneyKind,
      score: 0,
      reasons: [] as string[],
    };
    prev.score += points;
    prev.reasons.push(reason);
    scores.set(key, prev);
  };

  // "ليا عند X N ألف" → money waiting
  if (/ليا\s+عند/.test(lower) || /عندي\s+عند/.test(lower)) {
    bump("money_memory", "to_collect", 5, "pattern:waiting_at");
  }

  // "X خد N" → crew advance / out
  if (
    /[\u0600-\u06FFA-Za-z]{2,}\s+خد\s+\d/.test(text) ||
    /\btook\s+\d/.test(lower)
  ) {
    bump("money_memory", "crew_advance", 4.5, "pattern:took_amount");
  }

  // Partial payment language
  if (/دفع|دفعت|جزئي|partial|paid\s+\d/.test(lower)) {
    bump("money_memory", "to_collect", 2, "pattern:payment");
  }

  // Reminder with time words
  if (/بكرة|tomorrow|الساعة|at\s+\d/.test(lower) && /ذكر|remind|متنسا/.test(lower)) {
    bump("reminders", null, 3, "pattern:timed_reminder");
  }
}

/**
 * Parse Founder free text into a structured Understanding.
 * Does not persist anything.
 */
export function parseBrainText(raw: string): BrainUnderstanding {
  const text = raw.trim();
  const lower = text.toLowerCase();
  const scores = new Map<string, ScoreBucket>();

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

  applyPatternBoosts(text, lower, scores);

  let best: ScoreBucket | null = null;
  for (const s of scores.values()) {
    if (!best || s.score > best.score) best = s;
  }

  const amount = extractAmount(text);
  const phone = extractPhone(text);
  const currency = extractCurrency(text);

  let workspace: BrainWorkspace = "inbox";
  let moneyKind: MoneyKind | null = null;
  let confidence = 0.35;
  let reasons = ["default:inbox"];

  if (best && best.score >= 2) {
    workspace = best.workspace;
    moneyKind = best.moneyKind;
    confidence = Math.min(0.95, 0.42 + best.score * 0.07);
    reasons = best.reasons.slice(0, 8);
  } else if (amount != null) {
    // Amount alone → soft money inbox-ish note
    workspace = "money_memory";
    moneyKind = "note";
    confidence = 0.48;
    reasons = ["signal:amount_only"];
  }

  // Soft boost when company/person extracted alongside money
  const companyLabel =
    workspace === "money_memory" ||
    workspace === "potential_orders" ||
    workspace === "client_notebook" ||
    workspace === "meeting_notes"
      ? extractCompanyLabel(text)
      : extractCompanyLabel(text);

  const personLabel = extractPersonLabel(text, moneyKind);

  if (companyLabel && workspace === "money_memory") {
    confidence = Math.min(0.96, confidence + 0.06);
    reasons = [...reasons, `entity:company:${companyLabel}`].slice(0, 8);
  }
  if (personLabel && workspace === "money_memory") {
    confidence = Math.min(0.96, confidence + 0.05);
    reasons = [...reasons, `entity:person:${personLabel}`].slice(0, 8);
  }

  // Client notebook when "عميل" + name without money intensity
  if (
    workspace === "client_notebook" &&
    !companyLabel &&
    personLabel
  ) {
    // keep person as client label below
  }

  const moneyDirection = inferMoneyDirection(moneyKind, text);
  const clientLabel =
    workspace === "client_notebook" || workspace === "potential_orders"
      ? companyLabel ?? personLabel
      : companyLabel && workspace === "money_memory"
        ? companyLabel
        : null;

  const base = {
    rawText: text,
    workspace,
    confidence,
    moneyKind: workspace === "money_memory" ? moneyKind : null,
    moneyDirection: workspace === "money_memory" ? moneyDirection : null,
    amount,
    currency: amount != null ? currency ?? "EGP" : currency,
    personLabel,
    companyLabel,
    clientLabel,
    phone,
    title: firstLineTitle(text),
    status: defaultStatusForWorkspace(workspace),
    priority: null,
    budgetNote:
      workspace === "potential_orders" && amount != null
        ? String(amount)
        : null,
    dueAt: null,
    reminderEnabled: workspace === "reminders",
    reasons,
    founderSummaryAr: "",
    founderSummaryEn: "",
  };

  const understanding = enrichOperationsUnderstanding(base);
  const summaries = buildFounderSummary(understanding);
  understanding.founderSummaryAr = summaries.ar;
  understanding.founderSummaryEn = summaries.en;
  return understanding;
}
