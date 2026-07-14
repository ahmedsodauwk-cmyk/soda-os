/**
 * Founder Summary — short Egyptian Arabic COO voice (AR-first).
 * Local Intelligence Layer only (no ChatGPT / external API).
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

function appendErpHint(u: BrainUnderstanding, ar: string, en: string): {
  ar: string;
  en: string;
} {
  const hit = u.erpAwareness[0];
  if (!hit) return { ar, en };
  return {
    ar: `${ar} · ${hit.noteAr}`,
    en: `${en} · ${hit.noteEn}`,
  };
}

function appendQuestion(u: BrainUnderstanding, ar: string, en: string): {
  ar: string;
  en: string;
} {
  if (u.canApprove || !u.nextQuestionAr) return { ar, en };
  return {
    ar: `${ar} ${u.nextQuestionAr}`,
    en: `${en} ${u.nextQuestionEn ?? ""}`.trim(),
  };
}

export function buildFounderSummary(u: BrainUnderstanding): {
  ar: string;
  en: string;
} {
  const amountAr = fmtAmount(u.amount, u.currency, "ar");
  const amountEn = fmtAmount(u.amount, u.currency, "en");
  const who = whoOf(u);

  let ar: string;
  let en: string;

  if (u.intent === "create_client") {
    ar = who
      ? `تمام — عميل جديد: ${who}${u.phone ? ` · ${u.phone}` : ""}. مسودة لسه، مش هيتسجل في ERP غير لما توافق وتنفّذ.`
      : `تمام — نضيف عميل جديد. مسودة.`;
    en = who
      ? `Got it — new client: ${who}${u.phone ? ` · ${u.phone}` : ""}. Draft only until you Approve + Execute.`
      : `Got it — new client draft.`;
  } else if (u.intent === "create_order") {
    ar = who
      ? `أوردر لـ ${who}${u.projectType ? ` · ${u.projectType}` : ""}${u.shootDate ? ` · ${u.shootDate}` : ""}. مسودة ERP — مفيش تسجيل غير بعد الموافقة والتنفيذ.`
      : `أوردر جديد كمسودة. محتاج تفاصيل قبل التنفيذ.`;
    en = who
      ? `Order for ${who}${u.projectType ? ` · ${u.projectType}` : ""}${u.shootDate ? ` · ${u.shootDate}` : ""}. ERP draft — no write until Approve + Execute.`
      : `New order draft. Need a few details before execute.`;
  } else if (u.workspace === "money_memory" && u.moneyKind === "to_collect") {
    ar = who
      ? `فاهم — لينا عند ${who}${amountAr ? ` ${amountAr}` : ""}. هحطها مسودة في ذاكرة المال.`
      : `فاهم — فلوس مستحقة${amountAr ? ` ${amountAr}` : ""}. مسودة.`;
    en = who
      ? `Got it — ${who} owes us${amountEn ? ` ${amountEn}` : ""}. Money Memory draft.`
      : `Got it — money waiting${amountEn ? ` ${amountEn}` : ""}. Draft.`;
  } else if (u.workspace === "money_memory" && u.moneyKind === "crew_advance") {
    ar = who
      ? `فاهم — ${who} خد سلفة${amountAr ? ` ${amountAr}` : ""}. مسودة سلفة طاقم.`
      : `فاهم — سلفة طاقم${amountAr ? ` ${amountAr}` : ""}. مسودة.`;
    en = who
      ? `Got it — ${who} took an advance${amountEn ? ` ${amountEn}` : ""}. Crew advance draft.`
      : `Got it — crew advance${amountEn ? ` ${amountEn}` : ""}. Draft.`;
  } else if (u.workspace === "money_memory" && u.moneyKind === "lent") {
    ar = who
      ? `فاهم — سلفت ${who}${amountAr ? ` ${amountAr}` : ""}. مسودة.`
      : `فاهم — سلفة مدفوعة${amountAr ? ` ${amountAr}` : ""}. مسودة.`;
    en = who
      ? `Got it — lent ${who}${amountEn ? ` ${amountEn}` : ""}. Draft.`
      : `Got it — loan given${amountEn ? ` ${amountEn}` : ""}. Draft.`;
  } else if (u.workspace === "money_memory" && u.moneyKind === "debt") {
    ar = `فاهم — علينا${who ? ` لـ ${who}` : ""}${amountAr ? ` ${amountAr}` : ""}. مسودة دين.`;
    en = `Got it — we owe${who ? ` ${who}` : ""}${amountEn ? ` ${amountEn}` : ""}. Debt draft.`;
  } else if (u.workspace === "money_memory") {
    const kindAr = u.moneyKind ? MONEY_KIND_AR[u.moneyKind] : "ملاحظة مالية";
    ar = `فاهم — ${kindAr}${who ? ` · ${who}` : ""}${amountAr ? ` · ${amountAr}` : ""}. مسودة في ذاكرة المال.`;
    en = `Got it — ${u.moneyKind ? MONEY_KIND_LABELS_EN[u.moneyKind] : "money note"}${who ? ` · ${who}` : ""}${amountEn ? ` · ${amountEn}` : ""}. Money Memory draft.`;
  } else if (u.workspace === "reminders") {
    ar = `فاهم — تذكير${u.title ? ` «${u.title}»` : ""}. مسودة.`;
    en = `Got it — reminder${u.title ? ` “${u.title}”` : ""}. Draft.`;
  } else if (u.workspace === "potential_orders") {
    ar = who
      ? `فاهم — أوردر محتمل من ${who}${amountAr ? ` · ميزانية تقريباً ${amountAr}` : ""}. مسودة في الدماغ، مش ERP.`
      : `فاهم — أوردر محتمل${amountAr ? ` · ${amountAr}` : ""}. مسودة.`;
    en = who
      ? `Got it — potential order from ${who}${amountEn ? ` · ~${amountEn}` : ""}. Brain draft, not ERP.`
      : `Got it — potential order${amountEn ? ` · ${amountEn}` : ""}. Draft.`;
  } else if (u.workspace === "client_notebook") {
    ar = who
      ? `فاهم — ملاحظة عن ${who}. مسودة دفتر عملاء.`
      : `فاهم — ملاحظة عميل. مسودة.`;
    en = who
      ? `Got it — note about ${who}. Client notebook draft.`
      : `Got it — client note. Draft.`;
  } else if (u.workspace === "meeting_notes") {
    ar = `فاهم — نوتس اجتماع${who ? ` مع ${who}` : ""}. مسودة.`;
    en = `Got it — meeting notes${who ? ` with ${who}` : ""}. Draft.`;
  } else if (u.workspace === "ideas") {
    ar = `فاهم — فكرة${u.title ? ` «${u.title}»` : ""}. مسودة.`;
    en = `Got it — idea${u.title ? ` “${u.title}”` : ""}. Draft.`;
  } else if (u.workspace === "personal_decisions") {
    ar = `فاهم — قرار مفتوح. مسودة.`;
    en = `Got it — open decision. Draft.`;
  } else if (u.workspace === "future_plans") {
    ar = `فاهم — خطة جاية. مسودة.`;
    en = `Got it — future plan. Draft.`;
  } else {
    const wsAr = WORKSPACE_LABELS_AR[u.workspace];
    const wsEn = WORKSPACE_LABELS_EN[u.workspace];
    ar = `فاهم — ملاحظة${who ? ` عن ${who}` : ""} في «${wsAr}». مسودة.`;
    en = `Got it — note${who ? ` about ${who}` : ""} under “${wsEn}”. Draft.`;
  }

  ({ ar, en } = appendErpHint(u, ar, en));
  ({ ar, en } = appendQuestion(u, ar, en));

  if (u.lifecycle === "approved") {
    ar = `${ar} · موافق — جاهز للتنفيذ.`;
    en = `${en} · Approved — ready to execute.`;
  } else if (u.lifecycle === "executed") {
    ar = `${ar} · اتنفّذ.`;
    en = `${en} · Executed.`;
  } else {
    ar = `${ar} · مفيش تنفيذ غير لما توافق.`;
    en = `${en} · Nothing runs until you Approve.`;
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
