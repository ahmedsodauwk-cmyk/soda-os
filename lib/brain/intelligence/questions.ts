/**
 * Smart Questions — ask ONE missing piece at a time (human pace).
 * Egyptian Arabic Founder tone. Never writes anything.
 */

import type {
  BrainUnderstanding,
  ExecuteTarget,
  OpsIntent,
} from "@/lib/brain/intelligence/types";

const FIELD_QUESTIONS: Record<
  string,
  { ar: string; en: string }
> = {
  personOrCompany: {
    ar: "لمين؟",
    en: "Who?",
  },
  amount: {
    ar: "كام؟",
    en: "How much?",
  },
  moneyKind: {
    ar: "دي فلوس مستحقة ولا سلفة ولا دين؟",
    en: "Is this money waiting, a loan, or a debt?",
  },
  clientName: {
    ar: "اسم العميل إيه؟",
    en: "What's the client name?",
  },
  phone: {
    ar: "رقم الموبايل؟",
    en: "Phone number?",
  },
  shootDate: {
    ar: "التصور امتى؟",
    en: "When's the shoot?",
  },
  projectType: {
    ar: "نوع الشغل؟ (Wedding / Commercial / ...)",
    en: "Project type? (Wedding / Commercial / …)",
  },
  title: {
    ar: "هكتبها بعنوان إيه؟",
    en: "What title should I use?",
  },
};

function whoPresent(u: BrainUnderstanding): boolean {
  return Boolean(
    u.personLabel?.trim() ||
      u.companyLabel?.trim() ||
      u.clientLabel?.trim()
  );
}

/**
 * Ordered missing fields for the active intent + execute target.
 * First item drives the single next question.
 */
export function computeMissingFields(
  u: Pick<
    BrainUnderstanding,
    | "intent"
    | "executeTarget"
    | "amount"
    | "moneyKind"
    | "personLabel"
    | "companyLabel"
    | "clientLabel"
    | "phone"
    | "shootDate"
    | "projectType"
    | "title"
    | "rawText"
  >
): string[] {
  const missing: string[] = [];
  const intent = u.intent;
  const target = u.executeTarget;

  if (target === "erp_create_client") {
    if (!whoPresent(u as BrainUnderstanding) && !u.clientLabel?.trim()) {
      missing.push("clientName");
    }
    if (!u.phone?.trim()) missing.push("phone");
    return missing;
  }

  if (target === "erp_create_order") {
    if (!whoPresent(u as BrainUnderstanding)) missing.push("clientName");
    if (!u.phone?.trim()) missing.push("phone");
    if (!u.projectType?.trim()) missing.push("projectType");
    if (!u.shootDate?.trim()) missing.push("shootDate");
    return missing;
  }

  // Brain-only targets
  switch (intent) {
    case "money_memory":
      if (!whoPresent(u as BrainUnderstanding)) missing.push("personOrCompany");
      if (u.amount == null) missing.push("amount");
      if (!u.moneyKind) missing.push("moneyKind");
      break;
    case "potential_order":
      if (!whoPresent(u as BrainUnderstanding)) missing.push("clientName");
      break;
    case "create_client":
      if (!whoPresent(u as BrainUnderstanding)) missing.push("clientName");
      if (!u.phone?.trim()) missing.push("phone");
      break;
    case "create_order":
      if (!whoPresent(u as BrainUnderstanding)) missing.push("clientName");
      if (!u.phone?.trim()) missing.push("phone");
      if (!u.projectType?.trim()) missing.push("projectType");
      if (!u.shootDate?.trim()) missing.push("shootDate");
      break;
    case "reminder":
      if (!u.title?.trim() && !u.rawText?.trim()) missing.push("title");
      break;
    default:
      if (!u.rawText?.trim()) missing.push("title");
      break;
  }

  return missing;
}

export function nextSmartQuestion(
  missingFields: string[],
  alreadyAsked: string[] = []
): { field: string; ar: string; en: string } | null {
  const next = missingFields.find((f) => !alreadyAsked.includes(f));
  if (!next) return null;
  const q = FIELD_QUESTIONS[next] ?? {
    ar: "نقص حاجة — كمّل لو سمحت؟",
    en: "Something’s missing — can you fill it in?",
  };
  return { field: next, ar: q.ar, en: q.en };
}

export function canApproveDraft(
  missingFields: string[],
  confidence: number
): boolean {
  return missingFields.length === 0 && confidence >= 0.4;
}

export function defaultExecuteTarget(
  intent: OpsIntent
): ExecuteTarget {
  switch (intent) {
    case "create_client":
      return "erp_create_client";
    case "create_order":
      return "erp_create_order";
    default:
      return "brain_save";
  }
}

export function buildPotentialActions(
  intent: OpsIntent,
  executeTarget: ExecuteTarget
): BrainUnderstanding["potentialActions"] {
  const actions: BrainUnderstanding["potentialActions"] = [
    {
      id: "brain_save",
      labelAr: "احفظ في الدماغ بس",
      labelEn: "Save to Brain only",
      recommended: executeTarget === "brain_save",
    },
  ];

  if (
    intent === "create_client" ||
    intent === "client_note" ||
    intent === "potential_order"
  ) {
    actions.push({
      id: "erp_create_client",
      labelAr: "بعد الموافقة: أنشئ عميل في ERP",
      labelEn: "After approve: create ERP client",
      recommended: executeTarget === "erp_create_client",
    });
  }

  if (intent === "create_order" || intent === "potential_order") {
    actions.push({
      id: "erp_create_order",
      labelAr: "بعد الموافقة: أنشئ أوردر في ERP",
      labelEn: "After approve: create ERP order",
      recommended: executeTarget === "erp_create_order",
    });
  }

  return actions;
}
