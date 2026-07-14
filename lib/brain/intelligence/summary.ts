/**
 * Founder Summary — short Egyptian Arabic COO voice (AR-first).
 * Human confirmation style — never exposes Intent / Confidence / Parser.
 */

import {
  MONEY_KIND_LABELS_EN,
  WORKSPACE_LABELS_AR,
  WORKSPACE_LABELS_EN,
  type MoneyKind,
} from "@/lib/brain/types";
import type { BrainUnderstanding } from "@/lib/brain/intelligence/types";

const MONEY_KIND_AR: Record<MoneyKind, string> = {
  to_collect: "فلوس مستحقة",
  lent: "سلفة مدفوعة",
  debt: "دين علينا",
  crew_advance: "سلفة طاقم",
  client_debt: "دين عميل",
  note: "ملاحظة مالية",
};

function fmtAmount(
  amount: number | null,
  currency: string | null,
  locale: "ar" | "en"
): string | null {
  if (amount == null) return null;
  const cur = currency ?? "EGP";
  if (locale === "ar") {
    return `${amount.toLocaleString("ar-EG")} ${cur}`;
  }
  return `${amount.toLocaleString("en-EG")} ${cur}`;
}

function whoOf(u: BrainUnderstanding): string | null {
  return u.companyLabel ?? u.personLabel ?? u.clientLabel ?? null;
}

/** Soft human bullets for chat + Smart Understanding panel. */
export function buildUnderstandingBullets(u: BrainUnderstanding): {
  ar: string[];
  en: string[];
} {
  const ar: string[] = [];
  const en: string[] = [];
  const who = whoOf(u);
  const amountAr = fmtAmount(u.amount, u.currency, "ar");
  const amountEn = fmtAmount(u.amount, u.currency, "en");

  if (u.intent === "create_client") {
    ar.push(who ? `عميل جديد: ${who}` : "عميل جديد");
    en.push(who ? `New client: ${who}` : "New client");
    if (u.phone) {
      ar.push(`موبايل: ${u.phone}`);
      en.push(`Phone: ${u.phone}`);
    }
  } else if (u.intent === "create_order") {
    ar.push(who ? `أوردر لـ ${who}` : "أوردر جديد");
    en.push(who ? `Order for ${who}` : "New order");
    if (u.projectType) {
      ar.push(`نوع الشغل: ${u.projectType}`);
      en.push(`Type: ${u.projectType}`);
    }
    if (u.shootDate) {
      ar.push(`التصور: ${u.shootDate}`);
      en.push(`Shoot: ${u.shootDate}`);
    }
    if (u.phone) {
      ar.push(`موبايل: ${u.phone}`);
      en.push(`Phone: ${u.phone}`);
    }
  } else if (u.workspace === "money_memory" && u.moneyKind === "to_collect") {
    ar.push(who ? `لينا عند ${who}` : "فلوس مستحقة");
    en.push(who ? `${who} owes us` : "Money to collect");
    if (amountAr) ar.push(amountAr);
    if (amountEn) en.push(amountEn);
  } else if (u.workspace === "money_memory" && u.moneyKind === "crew_advance") {
    ar.push(who ? `${who} خد سلفة` : "سلفة طاقم");
    en.push(who ? `${who} took an advance` : "Crew advance");
    if (amountAr) ar.push(amountAr);
    if (amountEn) en.push(amountEn);
  } else if (u.workspace === "money_memory" && u.moneyKind === "lent") {
    ar.push(who ? `سلّفت ${who}` : "سلفة مدفوعة");
    en.push(who ? `Lent to ${who}` : "Loan given");
    if (amountAr) ar.push(amountAr);
    if (amountEn) en.push(amountEn);
  } else if (u.workspace === "money_memory" && u.moneyKind === "debt") {
    ar.push(who ? `علينا لـ ${who}` : "دين علينا");
    en.push(who ? `We owe ${who}` : "Debt");
    if (amountAr) ar.push(amountAr);
    if (amountEn) en.push(amountEn);
  } else if (u.workspace === "money_memory") {
    const kindAr = u.moneyKind ? MONEY_KIND_AR[u.moneyKind] : "ملاحظة مالية";
    ar.push(kindAr);
    en.push(
      u.moneyKind ? MONEY_KIND_LABELS_EN[u.moneyKind] : "Money note"
    );
    if (who) {
      ar.push(who);
      en.push(who);
    }
    if (amountAr) ar.push(amountAr);
    if (amountEn) en.push(amountEn);
  } else if (u.workspace === "reminders") {
    ar.push(u.title ? `تذكير: ${u.title}` : "تذكير");
    en.push(u.title ? `Reminder: ${u.title}` : "Reminder");
  } else if (u.workspace === "potential_orders") {
    ar.push(who ? `أوردر محتمل من ${who}` : "أوردر محتمل");
    en.push(who ? `Potential order from ${who}` : "Potential order");
    if (amountAr) ar.push(`تقريباً ${amountAr}`);
    if (amountEn) en.push(`~${amountEn}`);
  } else if (u.workspace === "client_notebook") {
    ar.push(who ? `ملاحظة عن ${who}` : "ملاحظة عميل");
    en.push(who ? `Note about ${who}` : "Client note");
  } else if (u.workspace === "meeting_notes") {
    ar.push(who ? `نوتس اجتماع مع ${who}` : "نوتس اجتماع");
    en.push(who ? `Meeting notes with ${who}` : "Meeting notes");
  } else if (u.workspace === "ideas") {
    ar.push(u.title ? `فكرة: ${u.title}` : "فكرة");
    en.push(u.title ? `Idea: ${u.title}` : "Idea");
  } else if (u.workspace === "personal_decisions") {
    ar.push("قرار مفتوح");
    en.push("Open decision");
  } else if (u.workspace === "future_plans") {
    ar.push("خطة جاية");
    en.push("Future plan");
  } else {
    const wsAr = WORKSPACE_LABELS_AR[u.workspace];
    ar.push(who ? `ملاحظة عن ${who}` : `ملاحظة في ${wsAr}`);
    en.push(
      who
        ? `Note about ${who}`
        : `Note · ${WORKSPACE_LABELS_EN[u.workspace]}`
    );
  }

  for (const hit of u.erpAwareness.slice(0, 1)) {
    ar.push(hit.noteAr);
    en.push(hit.noteEn);
  }

  return { ar, en };
}

export function buildFounderSummary(u: BrainUnderstanding): {
  ar: string;
  en: string;
} {
  const { ar: bulletsAr, en: bulletsEn } = buildUnderstandingBullets(u);

  let ar = `أنا فهمت إن:\n${bulletsAr.map((b) => `✓ ${b}`).join("\n")}`;
  let en = `Here's what I got:\n${bulletsEn.map((b) => `✓ ${b}`).join("\n")}`;

  if (u.canApprove) {
    ar = `${ar}\n\nهل فهمي صح؟`;
    en = `${en}\n\nDid I get that right?`;
  } else if (u.nextQuestionAr) {
    ar = `${ar}\n\n${u.nextQuestionAr}`;
    en = `${en}\n\n${u.nextQuestionEn ?? ""}`.trim();
  } else {
    ar = `${ar}\n\nكمّل لو ناقص حاجة.`;
    en = `${en}\n\nFill in anything missing.`;
  }

  if (u.lifecycle === "approved") {
    ar = `${ar}\n\nجاهز — اختر احفظ في Brain أو نفذ في النظام.`;
    en = `${en}\n\nReady — save to Brain or run in the system.`;
  } else if (u.lifecycle === "executed") {
    ar = `${ar}\n\nخلاص اتعمل.`;
    en = `${en}\n\nDone.`;
  }

  return { ar, en };
}

/** Rebuild summaries after Founder edits fields in the panel. */
export function refreshUnderstandingSummaries(
  u: BrainUnderstanding
): BrainUnderstanding {
  const { ar, en } = buildFounderSummary(u);
  return { ...u, founderSummaryAr: ar, founderSummaryEn: en };
}
