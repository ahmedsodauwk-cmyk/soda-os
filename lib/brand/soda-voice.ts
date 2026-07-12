import type {
  BriefAction,
  BriefCardCopy,
  BriefPriority,
  BriefSummaryStat,
  BusinessMood,
  CompanyPulseInsight,
  DashboardSectionKey,
  DashboardVoiceInput,
  DayPeriod,
  EmptyStateCopy,
  EmptyStateKey,
  HubSectionCopyKey,
  KpiCopyKey,
  LoadingKey,
  ModuleSloganKey,
  SectionCopy,
  SuccessKey,
  VoiceSignals,
  WarningKey,
  WelcomeMode,
} from "@/lib/brand/types";
import type { DashboardSnapshot } from "@/lib/dashboard/types";
import { HUMAN_LAYER } from "@/lib/brand/human-layer";

export type {
  BriefAction,
  BriefCardCopy,
  BriefPriority,
  BriefSummaryStat,
  BusinessMood,
  CompanyPulseInsight,
  DashboardSectionKey,
  DashboardVoiceInput,
  DayPeriod,
  EmptyStateCopy,
  EmptyStateKey,
  HubSectionCopyKey,
  KpiCopyKey,
  LoadingKey,
  ModuleSloganKey,
  SectionCopy,
  SuccessKey,
  VoiceSignals,
  WarningKey,
  WelcomeMode,
} from "@/lib/brand/types";

/** Fallback display name when profile full_name is unavailable. */
export const SODA_OPERATOR = "چونيور صودا";
export const SODA_OPERATOR_EN = "Junior Soda";

/** localStorage key for last Command Center visit (date YYYY-MM-DD). */
export const SODA_LAST_VISIT_KEY = "soda-visuals:last-visit";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/** Eastern Arabic digits for teammate-facing counts. */
export function toEasternDigits(value: number | string): string {
  return String(value).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]!);
}

/** Stable pick so SSR/client don't flicker within the same hour. */
function pickStable<T>(items: T[], seed: number): T {
  return items[Math.abs(seed) % items.length]!;
}

function daySeed(now: Date): number {
  return (
    now.getFullYear() * 10000 +
    (now.getMonth() + 1) * 100 +
    now.getDate() +
    now.getHours()
  );
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysBetween(a: string, b: string): number {
  const ms = Date.parse(b) - Date.parse(a);
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/**
 * Resolve welcome mode from last-visit date.
 * - No visit today → Morning Brief (first launch today)
 * - Gap ≥ 3 days → Welcome Back
 * - Same day return → Command Center directly
 */
export function resolveWelcomeMode(
  lastVisitKey: string | null,
  now: Date = new Date()
): WelcomeMode {
  const today = toDateKey(now);
  if (!lastVisitKey) return "morning_brief";
  if (lastVisitKey === today) return "command_center";
  const gap = daysBetween(lastVisitKey, today);
  if (gap >= 3) return "welcome_back";
  return "morning_brief";
}

export function getTodayVisitKey(now: Date = new Date()): string {
  return toDateKey(now);
}

/* -------------------------------------------------------------------------- */
/*  Time of day                                                               */
/* -------------------------------------------------------------------------- */

export function getDayPeriod(date: Date = new Date()): DayPeriod {
  const hour = date.getHours();
  if (hour >= 22 || hour < 5) return "late_night";
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

/** Rotating natural greetings — `{name}` replaced with profile / Junior Soda. */
const GREETINGS: Record<DayPeriod, string[]> = {
  morning: [
    `صباح الخير يا {name}`,
    `صباح النور يا {name}`,
    `يلا نبدأ بهدوء يا {name}`,
  ],
  afternoon: [
    `نهارك أبيض يا {name}`,
    `أهلاً بيك يا {name}`,
    `نص اليوم عدّى يا {name}`,
  ],
  evening: [
    `مساء الفل يا {name}`,
    `مساء الخير يا {name}`,
    `خلّينا نلمّ بهدوء يا {name}`,
  ],
  late_night: [
    `ليلة هادية يا {name}`,
    `لسه صاحي يا {name}؟ خلّينا نقفّل بهدوء`,
    `أهلاً بيك يا {name}`,
  ],
};

function resolveOperatorName(name?: string | null): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed.split(/\s+/)[0] ?? trimmed;
  return SODA_OPERATOR;
}

const HOOKS: Record<DayPeriod, Record<BusinessMood, string[]>> = {
  morning: {
    busy_day: [
      "اليوم مليان طاقة — رتّب الأولويات بدري وخلّي الإيقاع معاك.",
      "زحمة حلوة قدامنا. ركّز على اللي بضاغط الأول.",
    ],
    quiet_day: [
      "يوم هادي في الستوديو — فرصة ترتّب الـ pipeline بهدوء.",
      "الهدوء ده مش فراغ... استغلّه تجهّز اللي جاي.",
    ],
    great_month: [
      "الشهر ماشي بإيقاع قوي — خلّينا نحافظ على الجودة زي الزحمة.",
      "الأرقام بتقول إنكم كويسين. جاهزين نكمّل بنفس الطاقة؟",
    ],
    overdue_heavy: [
      "في حاجات محتاجة نظرة الأول — نفضّي الضغط قبل ما اليوم يسخن.",
      "قبل الزحمة... خلّص المتأخر. الستوديو هيرتاح.",
    ],
    shoots_ahead: [
      "الكاميرات هتشتغل النهاردة — جهّز الـ brief والفريق.",
      "يوم shoots قدامنا. يلا نكون جاهزين من بدري.",
    ],
    steady: [
      "يوم ثابت — خلّينا نخليه مظبوط من غير دراما.",
      "كل حاجة على السكة. ابدأ بهدوء وتركيز.",
    ],
  },
  afternoon: {
    busy_day: [
      "نص اليوم عدّى والإيقاع لسه عالي — كمّل بنفس التركيز.",
      "لسه في شغل قدامنا. متفرّقش الطاقة.",
    ],
    quiet_day: [
      "الستوديو هادي شوية دلوقتي — فرصة تراجع وتلمّ.",
      "هدوء حلو... رتّب اللي باقي بهدوء.",
    ],
    great_month: [
      "الأرقام ماشية كويس — متوقفش عند الحلو.",
      "كمّل بنفس الـ vibe. الشهر بتاعكم.",
    ],
    overdue_heavy: [
      "لسه في overdue محتاج قرار قبل المغرب.",
      "نفضّي الضغط دلوقتي = راحة بكرة.",
    ],
    shoots_ahead: [
      "الجدول لسه مليان طاقة — الـ shoots مستنياك.",
      "اتأكد إن الـ brief جاهز قبل ما اليوم يعدّي.",
    ],
    steady: [
      "كل حاجة ماشية تمام — نص اليوم وإحنا على السكة.",
      "ثابت ومظبوط... كمّل بهدوء.",
    ],
  },
  evening: {
    busy_day: [
      "يوم كان مليان... خلّينا نلخّص بهدوء قبل ما تقفل.",
      "قبل ما تقفل — نظرة سريعة على الأولويات؟",
    ],
    quiet_day: [
      "يوم هادي خلص بهدوء — يستاهل راحة حلوة.",
      "وقت الـ wrap-up الخفيف. بكرة صفحة جديدة.",
    ],
    great_month: [
      "قفّلنا يوم على شهر قوي — بكرة نزوّد.",
      "نهاردة زوّدت على الإيقاع الحلو.",
    ],
    overdue_heavy: [
      "قبل ما تنام — في حاجات لبكرة، خلّيها جاهزة.",
      "الأولويات جاهزة لبكرة... نام وأنت مرتّب.",
    ],
    shoots_ahead: [
      "بكرة فيه shoots... نام وأنت عارف الجدول.",
      "الجدول بكرة مليان — ارتاح عشان تكون جاهز.",
    ],
    steady: [
      "خلّصنا اليوم بهدوء — بكرة أحلى.",
      "وقت تلخّص وتريح. الستوديو تمام.",
    ],
  },
  late_night: {
    busy_day: [
      "لسه في شغل على الرادار — خلّي الأولويات واضحة قبل ما تقفل.",
    ],
    quiet_day: ["الستوديو هادي دلوقتي — فرصة تلخّص بهدوء."],
    great_month: ["الشهر ماشي كويس — قفّل بهدوء."],
    overdue_heavy: ["في حاجات محتاجة نظرة — رتّبها لبكرة بدري."],
    shoots_ahead: ["في shoots قريبة — الجدول ظاهر."],
    steady: ["كل حاجة على السكة — نام مرتاح."],
  },
};

const CLOSERS: Record<DayPeriod, Record<BusinessMood, string[]>> = {
  morning: {
    busy_day: ["يلا نكسر الدنيا بهدوء وتركيز.", "ركّز... وهنعدّي اليوم ده."],
    quiet_day: ["استغل الهدوء... ورتّب كويس.", "يوم هادي = شغل ذكي."],
    great_month: [
      "الشهر ماشي كويس... خلينا نحافظ على النسق.",
      "كمّل بنفس الطاقة.",
    ],
    overdue_heavy: [
      "نبدأ من Need Your Attention.",
      "أولوية النهاردة: نخلّص المتأخر.",
    ],
    shoots_ahead: ["جهّز الكاميرات... يلا.", "يوم تصوير حلو قدامكم."],
    steady: ["يلا نبدأ بهدوء وثبات.", "يوم عادي... بس هنخلّيه حلو."],
  },
  afternoon: {
    busy_day: ["كمّل بنفس الإيقاع.", "لسه نقدر نخلّص كتير."],
    quiet_day: ["هدّي الشغل... ورتّب الباقي.", "استغل الهدوء صح."],
    great_month: ["الإيقاع حلو — متوقفش.", "خلّي الجودة زي الزحمة."],
    overdue_heavy: ["فضّي اللي ضاغط الأول.", "قرار دلوقتي = راحة بكرة."],
    shoots_ahead: ["الـ brief جاهز؟ يلا.", "الكاميرات مستنية الإشارة."],
    steady: ["كمّل بهدوء... إحنا كويسين.", "ثابت ومظبوط."],
  },
  evening: {
    busy_day: ["بكرة نكمّل من مكان أقوى.", "نام وأنت عارف الأولويات."],
    quiet_day: ["يوم هادي يستاهل راحة حلوة.", "بكرة صفحة جديدة."],
    great_month: ["قفّل اليوم وأنت راضي.", "بكرة نزوّد على الحلو."],
    overdue_heavy: ["بكرة بدري... نفضّي الضغط.", "الأولويات جاهزة لبكرة."],
    shoots_ahead: ["بكرة يوم تصوير — ارتاح.", "الجدول جاهز... نام مرتاح."],
    steady: ["يوم تمام... بكرة أحلى.", "قفّل بهدوء."],
  },
  late_night: {
    busy_day: ["بكرة نكمّل من مكان أوضح."],
    quiet_day: ["نام بهدوء."],
    great_month: ["قفّل وأنت راضي."],
    overdue_heavy: ["الأولويات جاهزة لبكرة."],
    shoots_ahead: ["الجدول جاهز — ارتاح."],
    steady: ["قفّل بهدوء."],
  },
};

export function getGreeting(
  period: DayPeriod = getDayPeriod(),
  now: Date = new Date(),
  operatorName?: string | null
): string {
  const template = pickStable(GREETINGS[period], daySeed(now));
  return template.replaceAll("{name}", resolveOperatorName(operatorName));
}

function getHook(
  period: DayPeriod,
  mood: BusinessMood,
  now: Date
): string {
  return pickStable(HOOKS[period][mood], daySeed(now) + mood.length);
}

function getCloser(
  period: DayPeriod,
  mood: BusinessMood,
  now: Date
): string {
  return pickStable(CLOSERS[period][mood], daySeed(now) + 7);
}

/* -------------------------------------------------------------------------- */
/*  Module slogans — SODA Human Layer (Egyptian Arabic business explanations) */
/* -------------------------------------------------------------------------- */

/** Under English module titles — ops-manager voice, not fluff. */
export const MODULE_SLOGANS: Record<ModuleSloganKey, string> = {
  dashboard: HUMAN_LAYER.dashboard,
  orders: HUMAN_LAYER.orders,
  projects: HUMAN_LAYER.projects,
  clients: HUMAN_LAYER.clients,
  workspaces: HUMAN_LAYER.workspaces,
  projectHub: HUMAN_LAYER.projectHub,
  rtm: HUMAN_LAYER.rtm,
  weddings: HUMAN_LAYER.weddings,
  fashion: HUMAN_LAYER.fashion,
  product: HUMAN_LAYER.product,
  events: HUMAN_LAYER.events,
  commercial: HUMAN_LAYER.commercial,
  finance: HUMAN_LAYER.finance,
  quotations: HUMAN_LAYER.quotations,
  about: HUMAN_LAYER.about,
  login: HUMAN_LAYER.login,
  crew: HUMAN_LAYER.crew,
  crewProfile: HUMAN_LAYER.crewProfile,
  calendar: HUMAN_LAYER.calendar,
  statistics: HUMAN_LAYER.statistics,
  equipment: HUMAN_LAYER.equipment,
  settings: HUMAN_LAYER.settings,
  notifications: HUMAN_LAYER.notifications,
  mySpace: HUMAN_LAYER.mySpace,
  myWallet: HUMAN_LAYER.myWallet,
};

/** Resolve slogan for a workspace id/slug (falls back to workspaces). */
export function getWorkspaceSlogan(workspaceIdOrSlug: string): string {
  const key = workspaceIdOrSlug.toLowerCase() as ModuleSloganKey;
  if (key in MODULE_SLOGANS && key !== "dashboard" && key !== "orders") {
    return MODULE_SLOGANS[key];
  }
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
  const todayDeliveries = input.schedule.deliveries.filter(
    (d) => d.when === "today"
  ).length;

  return {
    overdueCount,
    unpaidCount,
    upcomingShoots: input.kpis.upcomingShoots,
    upcomingDeliveries: input.kpis.upcomingDeliveries,
    activeOrders: input.kpis.activeOrders,
    activeProjects: input.kpis.activeProjects,
    revenueMonthChangePct: input.kpis.revenueMonthChangePct,
    attentionCritical,
    todayShoots: input.schedule.todayShoots.length,
    todayDeliveries,
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

const MOOD_LABELS: Record<BusinessMood, string> = {
  busy_day: "Busy day",
  quiet_day: "Quiet day",
  great_month: "Great month",
  overdue_heavy: "Needs attention",
  shoots_ahead: "Shoots ahead",
  steady: "Steady",
};

export function getMoodLabel(mood: BusinessMood): string {
  return MOOD_LABELS[mood];
}

/* -------------------------------------------------------------------------- */
/*  Company Pulse — health sentences from snapshot                            */
/* -------------------------------------------------------------------------- */

/** Stable empty-state copy for Company Pulse — exact string required. */
export const COMPANY_PULSE_STABLE = "كل الأمور مستقرة حالياً.";

export function getCompanyPulse(
  snapshot: Pick<
    DashboardSnapshot,
    "kpis" | "attention" | "schedule" | "financial" | "team"
  >
): CompanyPulseInsight[] {
  const signals = extractVoiceSignals({
    kpis: snapshot.kpis,
    attention: snapshot.attention,
    schedule: snapshot.schedule,
  });
  const insights: CompanyPulseInsight[] = [];

  // Only real operational alerts — no filler
  if (signals.overdueCount > 0) {
    insights.push({
      id: "overdue-deliveries",
      label: "Overdue deliveries",
      insight: `${signals.overdueCount} overdue delivery${signals.overdueCount === 1 ? "" : "ies"} need action.`,
      tone: "pressure",
      href: "/attention",
    });
  }

  if (signals.todayShoots >= 1) {
    insights.push({
      id: "shoots-today",
      label: "Upcoming shoots",
      insight: `${signals.todayShoots} shoot${signals.todayShoots === 1 ? "" : "s"} today.`,
      tone: signals.todayShoots >= 2 ? "watch" : "neutral",
      href: "/schedule/today",
    });
  } else if (signals.upcomingShoots >= 1) {
    insights.push({
      id: "shoots-ahead",
      label: "Upcoming shoots",
      insight: `${signals.upcomingShoots} upcoming shoot${signals.upcomingShoots === 1 ? "" : "s"}.`,
      tone: "watch",
      href: "/calendar",
    });
  }

  if (signals.unpaidCount > 0) {
    insights.push({
      id: "unpaid-clients",
      label: "Unpaid clients",
      insight: `${signals.unpaidCount} unpaid client balance${signals.unpaidCount === 1 ? "" : "s"}.`,
      tone: "watch",
      href: "/attention",
    });
  }

  const overloaded = snapshot.team.filter((m) => m.currentWorkload >= 3);
  if (overloaded.length > 0) {
    const top = overloaded[0]!;
    insights.push({
      id: "crew-overload",
      label: "Crew overload",
      insight: `${top.name}: ${top.currentWorkload} active assignments.`,
      tone: "watch",
      href: `/crew/${top.id}`,
    });
  }

  const lateApprovals = snapshot.attention.filter(
    (a) =>
      a.category === "deadline_soon" &&
      (a.severity === "critical" || a.severity === "warning")
  );
  if (lateApprovals.length > 0) {
    insights.push({
      id: "late-approvals",
      label: "Late approvals",
      insight: `${lateApprovals.length} item${lateApprovals.length === 1 ? "" : "s"} waiting on approval / deadline.`,
      tone: "pressure",
      href: "/attention",
    });
  }

  if (snapshot.schedule.deadlines.length > 0) {
    const next = snapshot.schedule.deadlines[0]!;
    insights.push({
      id: "upcoming-deadlines",
      label: "Upcoming deadlines",
      insight: `${snapshot.schedule.deadlines.length} deadline${snapshot.schedule.deadlines.length === 1 ? "" : "s"} — next: ${next.title} (${next.date}).`,
      tone: "watch",
      href: next.href || "/schedule/deadlines",
    });
  }

  return insights.slice(0, 6);
}

/* -------------------------------------------------------------------------- */
/*  Welcome Back copy                                                         */
/* -------------------------------------------------------------------------- */

export function getWelcomeBackCopy(
  input: DashboardVoiceInput,
  now: Date = new Date(),
  operatorName?: string | null
): BriefCardCopy {
  const brief = getBriefCopy(input, now, operatorName);
  const name = resolveOperatorName(operatorName);
  return {
    ...brief,
    label: "Welcome Back",
    greeting: `منوّر تاني يا ${name}`,
    hook: "غبت كام يوم — خلّينا نرجّعك على السكة بسرعة.",
    closer: "يلا ندخل ونشوف إيه اللي بضاغط.",
  };
}

/* -------------------------------------------------------------------------- */
/*  Brief cards (Morning / Afternoon / Evening) — hero voice                  */
/* -------------------------------------------------------------------------- */

function buildBriefLines(signals: VoiceSignals, mood: BusinessMood): string[] {
  const lines: string[] = [];
  const n = toEasternDigits;
  void mood;

  if (signals.todayShoots > 0) {
    lines.push(
      signals.todayShoots === 1
        ? "عندك شوت واحد النهاردة"
        : `عندك ${n(signals.todayShoots)} شوتات النهاردة`
    );
  } else if (signals.upcomingShoots > 0) {
    lines.push(`عندك ${n(signals.upcomingShoots)} شوتات قريبة في الجدول`);
  }

  if (signals.todayDeliveries > 0) {
    lines.push(
      signals.todayDeliveries === 1
        ? "فيه تسليم النهاردة"
        : `فيه ${n(signals.todayDeliveries)} تسليم النهاردة`
    );
  } else if (signals.upcomingDeliveries > 0 && lines.length < 2) {
    lines.push(`فيه ${n(signals.upcomingDeliveries)} تسليمات قريبة`);
  }

  if (signals.overdueCount > 0) {
    lines.push(
      signals.overdueCount === 1
        ? "فيه تسليمة متأخرة محتاجة متابعة"
        : `فيه ${n(signals.overdueCount)} تسليمات متأخرة`
    );
  } else if (signals.unpaidCount > 0 && lines.length < 3) {
    lines.push(
      signals.unpaidCount === 1
        ? "فيه عميل مستني متابعة فلوس"
        : `فيه ${n(signals.unpaidCount)} عملاء عليهم فلوس`
    );
  }

  if (
    mood === "great_month" &&
    signals.revenueMonthChangePct != null &&
    lines.length < 3
  ) {
    const pct = signals.revenueMonthChangePct;
    const sign = pct >= 0 ? "+" : "";
    lines.push(`Revenue الشهر ده ${sign}${n(pct)}٪`);
  }

  return lines.slice(0, 3);
}

function buildBriefSummary(
  signals: VoiceSignals,
  attentionTotal: number
): BriefSummaryStat[] {
  return [
    {
      key: "shoots",
      label: "Shoots today",
      value: signals.todayShoots,
      whisper:
        signals.todayShoots > 0
          ? "الكاميرات شغّالة النهاردة."
          : "مفيش shoot النهاردة.",
    },
    {
      key: "deliveries",
      label: "Deliveries today",
      value: signals.todayDeliveries,
      whisper:
        signals.todayDeliveries > 0
          ? "تسليمات على الرادار."
          : "مفيش تسليمة النهاردة.",
    },
    {
      key: "attention",
      label: "Needs attention",
      value: attentionTotal,
      whisper:
        attentionTotal > 0
          ? "تعالى نخلّص دول الأول."
          : "كل حاجة تمام.",
    },
    {
      key: "orders",
      label: "Active orders",
      value: signals.activeOrders,
      whisper:
        signals.activeOrders > 0
          ? "الـ pipeline صاحي."
          : "فاضي شوية دلوقتي.",
    },
  ];
}

function severityRank(severity: "critical" | "warning" | "info"): number {
  if (severity === "critical") return 0;
  if (severity === "warning") return 1;
  return 2;
}

function buildBriefPriority(input: DashboardVoiceInput): BriefPriority | null {
  const sorted = [...input.attention].sort(
    (a, b) => severityRank(a.severity) - severityRank(b.severity)
  );
  const topIssue = sorted[0];
  if (topIssue) {
    return {
      eyebrow: "Top priority",
      title: topIssue.title,
      detail: topIssue.detail,
      href: topIssue.href ?? "/orders",
      ctaLabel: "Open issue",
    };
  }

  const nextShoot =
    input.schedule.todayShoots[0] ??
    input.schedule.tomorrowShoots[0] ??
    null;
  if (nextShoot) {
    return {
      eyebrow: nextShoot.when === "today" ? "Next up today" : "Coming up",
      title: nextShoot.title,
      detail: `${nextShoot.clientName} · ${nextShoot.location}`,
      href: "/orders",
      ctaLabel: "View schedule",
    };
  }

  const nextDelivery = input.schedule.deliveries[0];
  if (nextDelivery) {
    return {
      eyebrow: "Next delivery",
      title: nextDelivery.title,
      detail: `${nextDelivery.clientName} · ${nextDelivery.date}`,
      href: "/orders",
      ctaLabel: "Open orders",
    };
  }

  return null;
}

function buildBriefActions(
  signals: VoiceSignals,
  hasAttention: boolean
): BriefAction[] {
  if (hasAttention || signals.overdueCount > 0) {
    return [
      { label: "Review attention", href: "/attention", emphasis: "primary" },
      { label: "Open orders", href: "/orders", emphasis: "secondary" },
      { label: "View timeline", href: "/schedule/today", emphasis: "secondary" },
    ];
  }

  if (signals.todayShoots > 0 || signals.upcomingShoots > 0) {
    return [
      { label: "View timeline", href: "/schedule/today", emphasis: "primary" },
      { label: "Open orders", href: "/orders", emphasis: "secondary" },
      { label: "Review attention", href: "/attention", emphasis: "secondary" },
    ];
  }

  return [
    { label: "Enter Command Center", href: "#command-core", emphasis: "primary" },
    { label: "Open orders", href: "/orders", emphasis: "secondary" },
    { label: "View timeline", href: "/schedule/today", emphasis: "secondary" },
  ];
}

export function getBriefCopy(
  input: DashboardVoiceInput,
  now: Date = new Date(),
  operatorName?: string | null
): BriefCardCopy {
  const period = getDayPeriod(now);
  const signals = extractVoiceSignals(input);
  const mood = deriveBusinessMood(signals);
  const greeting = getGreeting(period, now, operatorName);
  const hook = getHook(period, mood, now);
  const lines = buildBriefLines(signals, mood);
  const closer = getCloser(period, mood, now);
  const summary = buildBriefSummary(signals, input.attention.length);
  const priority = buildBriefPriority(input);
  const actions = buildBriefActions(signals, input.attention.length > 0);

  const label =
    period === "morning"
      ? "Morning Brief"
      : period === "evening" || period === "late_night"
        ? "Evening Summary"
        : "Afternoon Check-in";

  return {
    period,
    mood,
    label,
    greeting,
    hook,
    lines,
    closer,
    summary,
    priority,
    actions,
  };
}

/** @deprecated Prefer getBriefCopy().hook / lines — kept for soft compatibility. */
export function getMoodMessage(
  mood: BusinessMood,
  now: Date = new Date()
): string {
  return getHook(getDayPeriod(now), mood, now);
}

/* -------------------------------------------------------------------------- */
/*  Empty states                                                              */
/* -------------------------------------------------------------------------- */

export const EMPTY_STATES: Record<EmptyStateKey, EmptyStateCopy> = {
  orders: {
    title: "لسه مفيش أوردرات.",
    description: "اعمل أول أوردر وهيظهر هنا.",
  },
  clients: {
    title: "لسه مفيش عملاء.",
    description: "ضيف أول عميل وابدأ رحلته مع الشركة.",
  },
  workspaces: {
    title: "لسه مفيش مسارات هنا.",
    description: "أول ما يبدأ شغل تجاري هتلاقيه ظاهر.",
  },
  projects: {
    title: "لسه مفيش مشاريع.",
    description: "أول مشروع هيظهر هنا تلقائيًا.",
  },
  files: {
    title: "لسه مفيش ملفات.",
    description: "ارفع أول ملف وهيتحط هنا.",
  },
  shoots: {
    title: "لسه مفيش شوتات قريبة.",
    description: "أول ما يتحدد معاد تصوير هتشوفه هنا.",
  },
  deliveries: {
    title: "لسه مفيش تسليمات قريبة.",
    description: "التسليمات هتظهر أول ما تتحدد.",
  },
  deadlines: {
    title: "مفيش ديدلاينز قريبة.",
    description: "الديدلاينز الجاية هتتلمّ هنا.",
  },
  payments: {
    title: "لسه مفيش دفعات.",
    description: "أول دفعة هتتسجل هنا.",
  },
  team: {
    title: "لسه مفيش فريق متعيّن.",
    description: "عيّن حد من الفريق وهيظهر هنا.",
  },
  attentionClear: {
    title: "كل الأمور مستقرة حالياً.",
    description: "مفيش حاجة ضاغطة محتاجة نظرة دلوقتي.",
  },
  notes: {
    title: "لسه مفيش ملاحظات.",
    description: "اكتب أول ملاحظة وهيتحفظ هنا.",
  },
  activity: {
    title: "لسه مفيش نشاط.",
    description: "أول ما يحصل حركة هتشوفها هنا.",
  },
  deliverables: {
    title: "لسه مفيش تسليمات مطلوبة.",
    description: "التسليمات هتظهر مع تقدّم الشغل.",
  },
};

export function getEmptyState(key: EmptyStateKey): EmptyStateCopy {
  return EMPTY_STATES[key];
}

/* -------------------------------------------------------------------------- */
/*  Success / warning / loading                                               */
/* -------------------------------------------------------------------------- */

export const SUCCESS_MESSAGES: Record<SuccessKey, string> = {
  orderCreated: "تمام — الـ Order اتضاف، والـ pipeline اتحرك.",
  clientCreated: "حلو — الـ Client بقى في النظام.",
};

export const WARNING_MESSAGES: Record<WarningKey, string> = {
  overdueDeliveries: "في deliveries overdue — خلّيها أولوية النهاردة.",
  unpaidBalances: "في balances لسه unpaid — وقت الـ follow-up.",
  deadlineSoon: "في deadlines قريبة — متستناش لآخر لحظة.",
  unassignedTeam: "في Projects من غير فريق — عيّن حد بسرعة.",
};

export const LOADING_MESSAGES: Record<LoadingKey, string> = {
  default: "Loading…",
  dashboard: "Loading Command Center…",
  orders: "Loading orders…",
  clients: "Loading clients…",
  workspaces: "Loading commercial…",
  project: "Loading project…",
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
/*  Notifications (header) — pink-accent awareness                            */
/* -------------------------------------------------------------------------- */

export const NOTIFICATION_COPY = [
  "Review overdue deliveries in Need Your Attention.",
  "Follow up unpaid clients under Clients → Commercial.",
  "Check crew pay outstanding under The Crew.",
] as const;

/* -------------------------------------------------------------------------- */
/*  Command Center section microcopy                                          */
/* -------------------------------------------------------------------------- */

export const DASHBOARD_SECTION_COPY: Record<DashboardSectionKey, SectionCopy> =
  {
    operations: {
      title: "What today?",
      description: HUMAN_LAYER.operations,
    },
    kpis: {
      title: "What today?",
      description: HUMAN_LAYER.operations,
    },
    attention: {
      title: "Need Your Attention",
      description: HUMAN_LAYER.attention,
    },
    schedule: {
      title: "Today's Timeline",
      description: HUMAN_LAYER.schedule,
    },
    financial: {
      title: "Financial Summary",
      description: HUMAN_LAYER.financialSummary,
    },
    recentOrders: {
      title: "Recent Orders",
      description: HUMAN_LAYER.recentOrders,
    },
    projects: {
      title: "Commercial lanes",
      description: HUMAN_LAYER.commercialLanes,
    },
    workspaces: {
      title: "Commercial lanes",
      description: HUMAN_LAYER.commercialLanes,
    },
    team: {
      title: "The Crew — workload",
      description: HUMAN_LAYER.crewWorkload,
    },
    quickActions: {
      title: "Quick Actions",
      description: HUMAN_LAYER.quickActions,
    },
    sodaLive: {
      title: "SODA LIVE",
      description: HUMAN_LAYER.sodaLive,
    },
    companyPulse: {
      title: "Company Pulse",
      description: HUMAN_LAYER.companyPulse,
    },
  };

/** KPI titles — Human Layer whisper under English label. */
export const KPI_COPY: Record<
  KpiCopyKey,
  { title: string; whisper: string }
> = {
  revenueThisMonth: {
    title: "Revenue this month",
    whisper: HUMAN_LAYER.revenueThisMonth,
  },
  revenueLastMonth: {
    title: "Revenue last month",
    whisper: HUMAN_LAYER.revenueLastMonth,
  },
  outstanding: {
    title: "Outstanding payments",
    whisper: HUMAN_LAYER.outstandingPayments,
  },
  activeProjects: {
    title: "Active projects",
    whisper: HUMAN_LAYER.activeProjects,
  },
  activeOrders: {
    title: "Active orders",
    whisper: HUMAN_LAYER.activeOrders,
  },
  upcomingShoots: {
    title: "Upcoming shoots",
    whisper: HUMAN_LAYER.upcomingShoots,
  },
  upcomingDeliveries: {
    title: "Upcoming deliveries",
    whisper: HUMAN_LAYER.upcomingDeliveries,
  },
  activeClients: {
    title: "Active clients",
    whisper: HUMAN_LAYER.activeClients,
  },
};

/** MoM delta only — no decorative copy. */
export function getRevenueWhisper(changePct: number | null): string {
  if (changePct == null) return "";
  const sign = changePct > 0 ? "+" : "";
  return `${sign}${changePct.toFixed(1)}% vs last month`;
}

export function getOutstandingWhisper(amount: number): string {
  if (amount <= 0) return "";
  return `${amount.toLocaleString("en-EG")} EGP open`;
}

export function getActiveProjectsWhisper(count: number): string {
  if (count === 0) return "";
  return `${count} active`;
}

export function getUpcomingShootsWhisper(count: number): string {
  if (count === 0) return "";
  return `${count} scheduled`;
}

/* -------------------------------------------------------------------------- */
/*  Project hub section microcopy                                             */
/* -------------------------------------------------------------------------- */

export const HUB_SECTION_COPY: Record<HubSectionCopyKey, SectionCopy> = {
  overview: {
    title: "Overview",
    description: HUMAN_LAYER.hubOverview,
  },
  orders: {
    title: "Orders",
    description: HUMAN_LAYER.hubOrders,
  },
  calendar: {
    title: "Calendar",
    description: HUMAN_LAYER.hubCalendar,
  },
  files: {
    title: "Files",
    description: HUMAN_LAYER.hubFiles,
  },
  payments: {
    title: "Payments",
    description: HUMAN_LAYER.hubPayments,
  },
  timeline: {
    title: "Timeline",
    description: HUMAN_LAYER.hubTimeline,
  },
  team: {
    title: "Assigned Crew",
    description: HUMAN_LAYER.hubTeam,
  },
  notes: {
    title: "Notes",
    description: HUMAN_LAYER.hubNotes,
  },
  activity: {
    title: "Activity",
    description: HUMAN_LAYER.hubActivity,
  },
  deliverables: {
    title: "Deliverables",
    description: HUMAN_LAYER.hubDeliverables,
  },
  upcomingShoots: {
    title: "Upcoming Shoots",
    description: HUMAN_LAYER.hubUpcomingShoots,
  },
};

/* -------------------------------------------------------------------------- */
/*  About page copy                                                           */
/* -------------------------------------------------------------------------- */

export const ABOUT_COPY = {
  eyebrow: "About SODA VISUALS",
  headline: "بنحوّل اللحظة لقصة تفضل.",
  missionTitle: "Mission",
  mission:
    "نساعد الستوديو يشتغل بإيقاع واضح — من أول مكالمة لحد آخر تسليمة — من غير ما الإبداع يتوه في الزحمة.",
  visionTitle: "Vision",
  vision:
    "SODA VISUALS يبقى نظام التشغيل بتاع كل creative studio عايز شغل مرتّب وطاقة عالية في نفس الوقت.",
  valuesTitle: "Values",
  values: [
    {
      title: "Clarity",
      body: "كل قرار واضح. كل deadline ظاهر. مفيش شغل بيتوه.",
    },
    {
      title: "Craft",
      body: "الجودة مش option — دي هوية الستوديو.",
    },
    {
      title: "Rhythm",
      body: "إيقاع الشغل أهم من الزحمة. نشتغل صح، مش بس كتير.",
    },
    {
      title: "Team",
      body: "الكاميرا بتتصور... والناس هي اللي بتخلي الصورة SODA.",
    },
  ],
  teamTitle: "The crew",
  teamWhisper: "أسماء الستوديو — الأدوار بالإنجليزي، الأسماء بالعربي.",
  partnersTitle: "Partners",
  partnersWhisper: "مساحة للشركاء قريب — لسه بنجهّز القائمة.",
} as const;
