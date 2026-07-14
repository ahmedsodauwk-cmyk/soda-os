/**
 * Founder Summary — natural AR-first phrasing from structured understanding.
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

export function buildFounderSummary(u: BrainUnderstanding): {
  ar: string;
  en: string;
} {
  const confPct = Math.round(u.confidence * 100);
  const amountAr = fmtAmount(u.amount, u.currency, "ar");
  const amountEn = fmtAmount(u.amount, u.currency, "en");
  const whoAr =
    u.companyLabel ?? u.personLabel ?? u.clientLabel ?? null;
  const whoEn = whoAr;

  let ar: string;
  let en: string;

  if (u.workspace === "money_memory" && u.moneyKind === "to_collect") {
    ar = whoAr
      ? `فاهم: في فلوس مستحقة عند ${whoAr}${amountAr ? ` بمبلغ ${amountAr}` : ""}. عايز أحفظها في ذاكرة المال؟`
      : `فاهم: فلوس مستحقة${amountAr ? ` بمبلغ ${amountAr}` : ""}. عايز أحفظها في ذاكرة المال؟`;
    en = whoEn
      ? `Understood: money waiting from ${whoEn}${amountEn ? ` — ${amountEn}` : ""}. Save to Money Memory?`
      : `Understood: money waiting${amountEn ? ` — ${amountEn}` : ""}. Save to Money Memory?`;
  } else if (u.workspace === "money_memory" && u.moneyKind === "crew_advance") {
    ar = whoAr
      ? `فاهم: ${whoAr} خد سلفة${amountAr ? ` ${amountAr}` : ""}. أحفظها كسلفة طاقم؟`
      : `فاهم: سلفة طاقم${amountAr ? ` بمبلغ ${amountAr}` : ""}. أحفظها؟`;
    en = whoEn
      ? `Understood: ${whoEn} took an advance${amountEn ? ` of ${amountEn}` : ""}. Save as crew advance?`
      : `Understood: crew advance${amountEn ? ` — ${amountEn}` : ""}. Save?`;
  } else if (u.workspace === "money_memory" && u.moneyKind === "lent") {
    ar = whoAr
      ? `فاهم: سلفت ${whoAr}${amountAr ? ` ${amountAr}` : ""}. أحفظها؟`
      : `فاهم: سلفة مدفوعة${amountAr ? ` ${amountAr}` : ""}. أحفظها؟`;
    en = whoEn
      ? `Understood: you lent ${whoEn}${amountEn ? ` ${amountEn}` : ""}. Save?`
      : `Understood: loan given${amountEn ? ` — ${amountEn}` : ""}. Save?`;
  } else if (u.workspace === "money_memory" && u.moneyKind === "debt") {
    ar = `فاهم: دين علينا${whoAr ? ` لـ ${whoAr}` : ""}${amountAr ? ` بمبلغ ${amountAr}` : ""}. أحفظها؟`;
    en = `Understood: we owe${whoEn ? ` ${whoEn}` : ""}${amountEn ? ` ${amountEn}` : ""}. Save?`;
  } else if (u.workspace === "money_memory") {
    const kindAr = u.moneyKind ? MONEY_KIND_AR[u.moneyKind] : "ملاحظة مالية";
    ar = `فاهم: ${kindAr}${whoAr ? ` — ${whoAr}` : ""}${amountAr ? ` · ${amountAr}` : ""}. أحفظ في ذاكرة المال؟`;
    en = `Understood: ${u.moneyKind ? MONEY_KIND_LABELS_EN[u.moneyKind] : "money note"}${whoEn ? ` — ${whoEn}` : ""}${amountEn ? ` · ${amountEn}` : ""}. Save to Money Memory?`;
  } else if (u.workspace === "reminders") {
    ar = `فاهم: تذكير${u.title ? ` — «${u.title}»` : ""}. أحفظه في التذكيرات؟`;
    en = `Understood: reminder${u.title ? ` — “${u.title}”` : ""}. Save to Reminders?`;
  } else if (u.workspace === "potential_orders") {
    ar = whoAr
      ? `فاهم: أوردر محتمل من ${whoAr}${amountAr ? ` · ميزانية تقريبية ${amountAr}` : ""}. أحفظه؟`
      : `فاهم: أوردر محتمل${amountAr ? ` · ميزانية ${amountAr}` : ""}. أحفظه؟`;
    en = whoEn
      ? `Understood: potential order from ${whoEn}${amountEn ? ` · approx budget ${amountEn}` : ""}. Save?`
      : `Understood: potential order${amountEn ? ` · budget ${amountEn}` : ""}. Save?`;
  } else if (u.workspace === "client_notebook") {
    ar = whoAr
      ? `فاهم: ملاحظة عن العميل ${whoAr}. أحفظها في دفتر العملاء؟`
      : `فاهم: ملاحظة عميل. أحفظها في دفتر العملاء؟`;
    en = whoEn
      ? `Understood: client note about ${whoEn}. Save to Client Notebook?`
      : `Understood: client note. Save to Client Notebook?`;
  } else if (u.workspace === "meeting_notes") {
    ar = `فاهم: ملاحظات اجتماع${whoAr ? ` مع ${whoAr}` : ""}. أحفظها؟`;
    en = `Understood: meeting notes${whoEn ? ` with ${whoEn}` : ""}. Save?`;
  } else if (u.workspace === "ideas") {
    ar = `فاهم: فكرة${u.title ? ` — «${u.title}»` : ""}. أحفظها في الأفكار؟`;
    en = `Understood: idea${u.title ? ` — “${u.title}”` : ""}. Save to Ideas?`;
  } else if (u.workspace === "personal_decisions") {
    ar = `فاهم: قرار شخصي مفتوح. أحفظه للمتابعة؟`;
    en = `Understood: open personal decision. Save for follow-up?`;
  } else if (u.workspace === "future_plans") {
    ar = `فاهم: خطة مستقبلية. أحفظها؟`;
    en = `Understood: future plan. Save?`;
  } else {
    const wsAr = WORKSPACE_LABELS_AR[u.workspace];
    const wsEn = WORKSPACE_LABELS_EN[u.workspace];
    ar = `فاهم: ملاحظة عامة${whoAr ? ` عن ${whoAr}` : ""}. أحفظها في «${wsAr}»؟`;
    en = `Understood: general note${whoEn ? ` about ${whoEn}` : ""}. Save under “${wsEn}”?`;
  }

  ar = `${ar} (ثقة تقريبية ${confPct}٪ — مفيش حفظ غير لما توافق)`;
  en = `${en} (~${confPct}% confidence — nothing stored until you approve)`;

  return { ar, en };
}

/** Rebuild summaries after Founder edits fields in the panel. */
export function refreshUnderstandingSummaries(
  u: BrainUnderstanding
): BrainUnderstanding {
  const { ar, en } = buildFounderSummary(u);
  return { ...u, founderSummaryAr: ar, founderSummaryEn: en };
}
