import type {
  BriefCardCopy,
  BusinessMood,
  DashboardVoiceInput,
  DayPeriod,
  EmptyStateCopy,
  EmptyStateKey,
  LoadingKey,
  ModuleSloganKey,
  SuccessKey,
  VoiceSignals,
  WarningKey,
} from "@/lib/brand/types";

export type {
  BriefCardCopy,
  BusinessMood,
  DashboardVoiceInput,
  DayPeriod,
  EmptyStateCopy,
  EmptyStateKey,
  LoadingKey,
  ModuleSloganKey,
  SuccessKey,
  VoiceSignals,
  WarningKey,
} from "@/lib/brand/types";

/** Always address the operator as Junior Soda — never a real name. */
export const SODA_OPERATOR = "Junior Soda";

/* -------------------------------------------------------------------------- */
/*  Time of day                                                               */
/* -------------------------------------------------------------------------- */

export function getDayPeriod(date: Date = new Date()): DayPeriod {
  const hour = date.getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

const GREETINGS: Record<DayPeriod, string[]> = {
  morning: [
    `صباح الفل يا ${SODA_OPERATOR} ☀️`,
    `صباح الخير يا ${SODA_OPERATOR} — يوم جديد، شغل جديد.`,
    `يا صباح النشاط يا ${SODA_OPERATOR} ☕`,
  ],
  afternoon: [
    `نهارك أبيض يا ${SODA_OPERATOR}`,
    `إزيك يا ${SODA_OPERATOR} — نص اليوم عدّى، خلّينا نكمّل.`,
    `مساء الخير بدري شوية يا ${SODA_OPERATOR} 🌤️`,
  ],
  evening: [
    `مساء الفل يا ${SODA_OPERATOR} 🌙`,
    `يوم طويل يا ${SODA_OPERATOR} — خلّينا نلخّص.`,
    `مساء الخير يا ${SODA_OPERATOR} — وقت الـ wrap-up.`,
  ],
};

/** Stable pick so SSR/client don't flicker within the same hour. */
function pickStable<T>(items: T[], seed: number): T {
  return items[Math.abs(seed) % items.length]!;
}

export function getGreeting(
  period: DayPeriod = getDayPeriod(),
  now: Date = new Date()
): string {
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate() + now.getHours();
  return pickStable(GREETINGS[period], seed);
}

/* -------------------------------------------------------------------------- */
/*  Module slogans                                                            */
/* -------------------------------------------------------------------------- */

export const MODULE_SLOGANS: Record<ModuleSloganKey, string> = {
  dashboard: "كل اللي محتاج تعرفه... في مكان واحد.",
  orders: "من أول مكالمة... لحد آخر تسليمة.",
  projects: "كل فكرة عظيمة بدأت بـ Project.",
  clients: "العميل المرتاح... بيرجعلك تاني.",
  workspaces: "كل lane ليها شخصيتها... وإحنا بنسيّرها.",
  projectHub: "هنا قلب الـ Project... كل حاجة في مكانها.",
  rtm: "المحتوى بيحصل دلوقتي... وإحنا جاهزين.",
  weddings: "يوم العمر... وإحنا بنصوّره صح.",
  fashion: "جاهزين نطلع أحسن لوك؟",
  product: "المنتج بيتكلم... وإحنا بنخلّي الناس تسمع.",
  events: "اللحظة بتمر مرة واحدة... وإحنا بنمسكها.",
  commercial: "كل حملة ليها هدف... وإحنا بنوصله.",
};

/** Resolve slogan for a workspace id/slug (falls back to workspaces). */
export function getWorkspaceSlogan(workspaceIdOrSlug: string): string {
  const key = workspaceIdOrSlug.toLowerCase() as ModuleSloganKey;
  if (key in MODULE_SLOGANS && key !== "dashboard" && key !== "orders") {
    return MODULE_SLOGANS[key];
  }
  // product taxonomy uses "product"; Products label may appear as product
  if (workspaceIdOrSlug === "products") return MODULE_SLOGANS.product;
  return MODULE_SLOGANS.workspaces;
}

export function getModuleSlogan(key: ModuleSloganKey): string {
  return MODULE_SLOGANS[key];
}

/* -------------------------------------------------------------------------- */
/*  Business mood from dashboard snapshot                                     */
/* -------------------------------------------------------------------------- */

export function extractVoiceSignals(input: DashboardVoiceInput): VoiceSignals {
  const overdueCount = input.attention.filter(
    (a) => a.category === "overdue_delivery"
  ).length;
  const unpaidCount = input.attention.filter(
    (a) => a.category === "unpaid_client"
  ).length;
  const attentionCritical = input.attention.filter(
    (a) => a.severity === "critical"
  ).length;

  return {
    overdueCount,
    unpaidCount,
    upcomingShoots: input.kpis.upcomingShoots,
    activeOrders: input.kpis.activeOrders,
    activeProjects: input.kpis.activeProjects,
    revenueMonthChangePct: input.kpis.revenueMonthChangePct,
    attentionCritical,
    todayShoots: input.schedule.todayShoots.length,
  };
}

export function deriveBusinessMood(signals: VoiceSignals): BusinessMood {
  if (signals.overdueCount >= 3 || signals.attentionCritical >= 3) {
    return "overdue_heavy";
  }
  if (
    signals.revenueMonthChangePct != null &&
    signals.revenueMonthChangePct >= 15
  ) {
    return "great_month";
  }
  if (signals.upcomingShoots >= 5 || signals.todayShoots >= 2) {
    return "shoots_ahead";
  }
  if (signals.activeOrders >= 8 || signals.todayShoots >= 1) {
    return "busy_day";
  }
  if (signals.activeOrders <= 2 && signals.upcomingShoots <= 1) {
    return "quiet_day";
  }
  return "steady";
}

const MOOD_MESSAGES: Record<BusinessMood, string[]> = {
  busy_day: [
    "اليوم مليان حركة — Orders شغّالة والستوديو صاحي.",
    "يوم زحمة حلوة... خلّي بالك من الـ deliveries.",
    "الشغل ماشي بسرعة — ركّز على الأولويات.",
  ],
  quiet_day: [
    "يوم هادي شوية — فرصة ترتّب الـ pipeline.",
    "الستوديو ساكت اليوم... وقت مثالي للـ follow-ups.",
    "هدوء قبل العاصفة؟ استغلّه ورتّب الـ Projects.",
  ],
  great_month: [
    "الشهر ده ماشي تمام — Revenue طالع، كمل بنفس الإيقاع.",
    "أرقام الشهر بتقول إنكم على الطريق الصح 📈",
    "شهر قوي... خلّي الجودة زي الزحمة.",
  ],
  overdue_heavy: [
    "في حاجات overdue محتاجة نظرة دلوقتي — ابدأ من Attention Center.",
    "التسليمات المتأخرة كتير... أولوية النهاردة: نخلّصها.",
    "فيه ضغط على الـ deliveries — فريقك محتاج تركيز هنا.",
  ],
  shoots_ahead: [
    "في shoots كتير جاية — الجدول مليان طاقة 🎬",
    "الكاميرات هتشتغل قريب... تأكد إن الفرق جاهزة.",
    "موسم تصوير حلو قدامكم — حضّروا الـ brief كويس.",
  ],
  steady: [
    "الشغل ماشي بثبات — كده تمام.",
    "إيقاع هادي ومنظّم... استمر.",
    "كل حاجة تحت السيطرة — يوم عادي وحلو.",
  ],
};

export function getMoodMessage(
  mood: BusinessMood,
  now: Date = new Date()
): string {
  const seed =
    now.getFullYear() * 1000 +
    (now.getMonth() + 1) * 40 +
    now.getDate() +
    mood.length;
  return pickStable(MOOD_MESSAGES[mood], seed);
}

/* -------------------------------------------------------------------------- */
/*  Brief cards (Morning / Afternoon / Evening)                               */
/* -------------------------------------------------------------------------- */

function buildInsight(signals: VoiceSignals, mood: BusinessMood): string {
  const bits: string[] = [];

  if (signals.todayShoots > 0) {
    bits.push(
      `${signals.todayShoots} shoot${signals.todayShoots === 1 ? "" : "s"} النهاردة`
    );
  }
  if (signals.upcomingShoots > 0) {
    bits.push(`${signals.upcomingShoots} shoot قريب`);
  }
  if (signals.overdueCount > 0) {
    bits.push(`${signals.overdueCount} overdue`);
  }
  if (signals.unpaidCount > 0) {
    bits.push(`${signals.unpaidCount} unpaid`);
  }
  if (
    mood === "great_month" &&
    signals.revenueMonthChangePct != null
  ) {
    bits.push(`Revenue ${signals.revenueMonthChangePct >= 0 ? "+" : ""}${signals.revenueMonthChangePct}% الشهر ده`);
  }

  if (bits.length === 0) {
    return "كل حاجة هادية — استغل الوقت ترتّب.";
  }
  return bits.slice(0, 3).join(" · ");
}

export function getBriefCopy(
  input: DashboardVoiceInput,
  now: Date = new Date()
): BriefCardCopy {
  const period = getDayPeriod(now);
  const signals = extractVoiceSignals(input);
  const mood = deriveBusinessMood(signals);
  const greeting = getGreeting(period, now);
  const body = getMoodMessage(mood, now);
  const insight = buildInsight(signals, mood);

  if (period === "morning") {
    return {
      period,
      label: "Morning Brief",
      greeting,
      body,
      insight,
    };
  }

  if (period === "evening") {
    return {
      period,
      label: "Evening Summary",
      greeting,
      body:
        mood === "overdue_heavy"
          ? "قبل ما تقفل اليوم — في حاجات محتاجة قرار بكرة بدري."
          : mood === "busy_day" || mood === "shoots_ahead"
            ? "يوم كان مليان... بكرة كمان فيه شغل، نام وأنت مرتّب الأولويات."
            : "خلّصنا اليوم بهدوء — بكرة نكمّل من حيث وقفنا.",
      insight,
    };
  }

  return {
    period,
    label: "Midday Check-in",
    greeting,
    body,
    insight,
  };
}

/* -------------------------------------------------------------------------- */
/*  Empty states                                                              */
/* -------------------------------------------------------------------------- */

export const EMPTY_STATES: Record<EmptyStateKey, EmptyStateCopy> = {
  orders: {
    title: "مفيش Orders هنا",
    description: "جرّب تغيّر الـ filters... أو ابدأ Order جديد.",
  },
  clients: {
    title: "مفيش Clients ظاهرين",
    description: "وسّع البحث شوية، أو ضيف Client جديد.",
  },
  workspaces: {
    title: "مفيش Workspaces مطابقة",
    description: "جرّب كلمة تانية في البحث.",
  },
  projects: {
    title: "مفيش Projects هنا",
    description: "عدّل البحث أو الـ status... أو ابدأ Project جديد.",
  },
  files: {
    title: "لسه مفيش Files",
    description: "أول ما ترفع حاجة، هتظهر هنا.",
  },
  shoots: {
    title: "مفيش shoots قريبة",
    description: "الجدول فاضي دلوقتي — فرصة ترتّب.",
  },
  payments: {
    title: "مفيش Payments مسجّلة",
    description: "لما يتسجّل Payment، هتشوفه هنا.",
  },
  team: {
    title: "مفيش فريق متعيّن",
    description: "عيّن الفريق عشان الشغل يمشي أسرع.",
  },
  attentionClear: {
    title: "كل حاجة تمام ✅",
    description:
      "مفيش overdue deliveries ولا unpaid ولا deadlines قريبة.",
  },
};

export function getEmptyState(key: EmptyStateKey): EmptyStateCopy {
  return EMPTY_STATES[key];
}

/* -------------------------------------------------------------------------- */
/*  Success / warning / loading                                               */
/* -------------------------------------------------------------------------- */

export const SUCCESS_MESSAGES: Record<SuccessKey, string> = {
  orderCreated: "تمام — الـ Order اتضاف بنجاح ✨",
  clientCreated: "حلو — الـ Client بقى في النظام ✨",
};

export const WARNING_MESSAGES: Record<WarningKey, string> = {
  overdueDeliveries: "في deliveries overdue — خلّيها أولوية.",
  unpaidBalances: "في balances لسه unpaid — وقت الـ follow-up.",
  deadlineSoon: "في deadlines قريبة — متستناش لآخر لحظة.",
  unassignedTeam: "في Projects من غير فريق — عيّن حد بسرعة.",
};

export const LOADING_MESSAGES: Record<LoadingKey, string> = {
  default: "ثواني... بنجهّزلك الصفحة",
  dashboard: "بنجهّز الـ Dashboard...",
  orders: "بنحمّل الـ Orders...",
  clients: "بنحمّل الـ Clients...",
  workspaces: "بنحمّل الـ Workspaces...",
  project: "بنفتح الـ Project hub...",
};

export function getSuccessMessage(key: SuccessKey): string {
  return SUCCESS_MESSAGES[key];
}

export function getWarningMessage(key: WarningKey): string {
  return WARNING_MESSAGES[key];
}

export function getLoadingMessage(key: LoadingKey = "default"): string {
  return LOADING_MESSAGES[key];
}

/* -------------------------------------------------------------------------- */
/*  Notifications (header)                                                    */
/* -------------------------------------------------------------------------- */

export const NOTIFICATION_COPY = [
  "تسليمة Wedding بكرة — متتنساش تراجع الـ files.",
  "Commercial shoot اتأكد — الفريق جاهز.",
  "الـ Client دفع الـ deposit... فلوس دخلت 💸",
] as const;

/* -------------------------------------------------------------------------- */
/*  Dashboard section microcopy (warmer English chrome + mixed insights)      */
/* -------------------------------------------------------------------------- */

export const DASHBOARD_SECTION_COPY = {
  quickActions: {
    title: "Quick Actions",
    description: "اختصارات اليوم — ابدأ من هنا.",
  },
  financial: {
    title: "Financial Overview",
    description: "Revenue مقابل التحصيل — صورة الفلوس بوضوح.",
  },
  attention: {
    title: "Attention Center",
    description: "الحاجات اللي محتاجة نظرة دلوقتي.",
  },
  workspaces: {
    title: "Workspace Performance",
    description: "كل lane وقد إيه ماشية.",
  },
  team: {
    title: "Team Performance",
    description: "مين شغال أكتر النهاردة.",
  },
  schedule: {
    title: "Upcoming Schedule",
    description: "Shoots، deliveries، و deadlines الجاية.",
  },
  recentOrders: {
    title: "Recent Orders",
    description: "آخر الحجوزات اللي دخلت النظام.",
  },
} as const;
