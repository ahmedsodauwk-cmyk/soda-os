import type {
  BriefCardCopy,
  BusinessMood,
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
} from "@/lib/brand/types";

export type {
  BriefCardCopy,
  BusinessMood,
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
} from "@/lib/brand/types";

/** Always address the operator as Junior Soda — never a real name. */
export const SODA_OPERATOR = "Junior Soda";

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
    `☀️ صباح الفل يا ${SODA_OPERATOR}`,
    `☀️ صباح الخير يا ${SODA_OPERATOR}`,
    `☕ يا صباح النشاط يا ${SODA_OPERATOR}`,
  ],
  afternoon: [
    `🌤️ نهارك أبيض يا ${SODA_OPERATOR}`,
    `🌤️ إزيك يا ${SODA_OPERATOR}`,
    `☀️ نص اليوم عدّى يا ${SODA_OPERATOR}`,
  ],
  evening: [
    `🌙 مساء الفل يا ${SODA_OPERATOR}`,
    `🌙 مساء الخير يا ${SODA_OPERATOR}`,
    `✨ يوم طويل يا ${SODA_OPERATOR}`,
  ],
};

const HOOKS: Record<DayPeriod, Record<BusinessMood, string[]>> = {
  morning: {
    busy_day: ["جاهز ليوم مليان؟", "اليوم هيبقى زحمة حلوة."],
    quiet_day: ["يوم هادي... فرصة ترتّب.", "جاهز ليوم هادي ومنظّم؟"],
    great_month: ["الشهر ماشي تمام — نكمّل؟", "جاهز نكمل الإيقاع الحلو؟"],
    overdue_heavy: ["في حاجات محتاجة نظرة الأول.", "خلّينا نفضّي الضغط بدري."],
    shoots_ahead: ["الكاميرات هتشتغل النهاردة.", "جاهز ليوم shoots؟"],
    steady: ["جاهز ليوم جديد؟", "يلا نبدأ بهدوء وثبات."],
  },
  afternoon: {
    busy_day: ["نص اليوم عدّى... والإيقاع عالي.", "لسه في شغل قدامنا."],
    quiet_day: ["الستوديو هادي شوية دلوقتي.", "فرصة تراجع الـ pipeline."],
    great_month: ["الأرقام بتقول إنكم كويسين.", "كمّل بنفس الـ vibe."],
    overdue_heavy: ["لسه في overdue محتاج قرار.", "نفضّي دول قبل المغرب؟"],
    shoots_ahead: ["الجدول لسه مليان طاقة.", "الـ shoots الجاية مستنياك."],
    steady: ["كل حاجة ماشية تمام.", "نص اليوم... وإحنا على السكة."],
  },
  evening: {
    busy_day: ["يوم كان مليان... خلّينا نلخّص.", "قبل ما تقفل — نظرة سريعة؟"],
    quiet_day: ["يوم هادي خلص بهدوء.", "وقت الـ wrap-up الخفيف."],
    great_month: ["قفّلنا يوم على شهر قوي.", "نهاردة زوّدت على الإيقاع الحلو."],
    overdue_heavy: ["قبل ما تنام — في حاجات لبكرة.", "خلّي الأولويات جاهزة لبكرة."],
    shoots_ahead: ["بكرة فيه shoots... نام وأنت مرتّب.", "الجدول بكرة مليان."],
    steady: ["خلّصنا اليوم بهدوء.", "وقت تلخّص وتريح."],
  },
};

const CLOSERS: Record<DayPeriod, Record<BusinessMood, string[]>> = {
  morning: {
    busy_day: ["يلا نكسر الدنيا 💪", "ركّز... وهنعدّي اليوم ده."],
    quiet_day: ["استغل الهدوء... ورتّب كويس ✨", "يوم هادي = شغل ذكي."],
    great_month: ["كمّل بنفس الطاقة 🔥", "الشهر بتاعكم — خلّوه أقوى."],
    overdue_heavy: ["نبدأ من Attention Center 👀", "أولوية النهاردة: نخلّص المتأخر."],
    shoots_ahead: ["جهّز الكاميرات... يلا 📸", "يوم تصوير حلو قدامكم."],
    steady: ["يلا نكسر الدنيا 💪", "يوم عادي... بس هنخلّيه حلو."],
  },
  afternoon: {
    busy_day: ["كمّل بنفس الإيقاع 💪", "لسه نقدر نخلّص كتير."],
    quiet_day: ["هدّي الشغل... ورتّب الباقي ✨", "استغل الهدوء صح."],
    great_month: ["الإيقاع حلو — متوقفش 🔥", "خلّي الجودة زي الزحمة."],
    overdue_heavy: ["فضّي اللي ضاغط الأول 👀", "قرار دلوقتي = راحة بكرة."],
    shoots_ahead: ["الـ brief جاهز؟ يلا 🎬", "الكاميرات مستنية الإشارة."],
    steady: ["كمّل بهدوء... إحنا كويسين ✨", "ثابت ومظبوط."],
  },
  evening: {
    busy_day: ["بكرة نكمّل من مكان أقوى 🌙", "نام وأنت عارف الأولويات."],
    quiet_day: ["يوم هادي يستاهل راحة حلوة ✨", "بكرة صفحة جديدة."],
    great_month: ["قفّل اليوم وأنت راضي 🔥", "بكرة نزوّد على الحلو."],
    overdue_heavy: ["بكرة بدري... نفضّي الضغط 👀", "الأولويات جاهزة لبكرة."],
    shoots_ahead: ["بكرة يوم تصوير — ارتاح 📸", "الجدول جاهز... نام مرتاح."],
    steady: ["يوم تمام... بكرة أحلى 🌙", "قفّل بهدوء."],
  },
};

export function getGreeting(
  period: DayPeriod = getDayPeriod(),
  now: Date = new Date()
): string {
  return pickStable(GREETINGS[period], daySeed(now));
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
/*  Module slogans                                                            */
/* -------------------------------------------------------------------------- */

export const MODULE_SLOGANS: Record<ModuleSloganKey, string> = {
  dashboard: "كل اللي محتاج تعرفه... في مكان واحد.",
  orders: "من أول مكالمة...\nلحد آخر تسليمة.",
  projects: "كل فكرة عظيمة...\nبدأت بـ Project.",
  clients: "العميل المرتاح...\nبيرجعلك تاني.",
  workspaces: "كل مساحة شغل...\nليها قصة.",
  projectHub: "هنا قلب الـ Project...\nكل حاجة في مكانها.",
  rtm: "المحتوى بيحصل دلوقتي...\nوإحنا جاهزين.",
  weddings: "يوم العمر...\nوإحنا بنصوّره صح.",
  fashion: "جاهزين نطلع أحسن لوك؟",
  product: "المنتج بيتكلم...\nوإحنا بنخلّي الناس تسمع.",
  events: "اللحظة بتمر مرة واحدة...\nوإحنا بنمسكها.",
  commercial: "كل حملة ليها هدف...\nوإحنا بنوصله.",
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
/*  Brief cards (Morning / Afternoon / Evening) — hero voice                  */
/* -------------------------------------------------------------------------- */

function buildBriefLines(signals: VoiceSignals, mood: BusinessMood): string[] {
  const lines: string[] = [];
  const n = toEasternDigits;

  if (signals.todayShoots > 0) {
    const shootWord =
      signals.todayShoots === 1 ? "shoot" : "shoots";
    lines.push(
      `عندك ${n(signals.todayShoots)} ${shootWord} النهاردة.`
    );
  } else if (signals.upcomingShoots > 0) {
    lines.push(
      `عندك ${n(signals.upcomingShoots)} shoot قريب في الجدول.`
    );
  }

  if (signals.todayDeliveries > 0) {
    lines.push(
      signals.todayDeliveries === 1
        ? "وفيه تسليمة النهاردة — متتنساش تتابعها."
        : `وفيه ${n(signals.todayDeliveries)} deliveries النهاردة.`
    );
  } else if (signals.upcomingDeliveries > 0 && lines.length < 2) {
    lines.push(
      `وفيه ${n(signals.upcomingDeliveries)} delivery قريبة.`
    );
  }

  if (signals.overdueCount > 0) {
    lines.push(
      signals.overdueCount === 1
        ? "في تسليمة overdue محتاجة نظرة."
        : `في ${n(signals.overdueCount)} overdue محتاجين نظرة.`
    );
  } else if (signals.unpaidCount > 0 && lines.length < 2) {
    lines.push(
      signals.unpaidCount === 1
        ? "في Client لسه unpaid — وقت الـ follow-up."
        : `في ${n(signals.unpaidCount)} Clients لسه unpaid.`
    );
  }

  if (
    mood === "great_month" &&
    signals.revenueMonthChangePct != null &&
    lines.length < 2
  ) {
    const pct = signals.revenueMonthChangePct;
    const sign = pct >= 0 ? "+" : "";
    lines.push(`Revenue الشهر ده ${sign}${n(pct)}٪ — الدنيا ماشية.`);
  }

  if (lines.length === 0) {
    if (mood === "quiet_day") {
      lines.push("الجدول فاضي شوية — فرصة ترتّب الـ pipeline.");
    } else {
      lines.push("كل حاجة تحت السيطرة دلوقتي.");
    }
  }

  return lines.slice(0, 3);
}

export function getBriefCopy(
  input: DashboardVoiceInput,
  now: Date = new Date()
): BriefCardCopy {
  const period = getDayPeriod(now);
  const signals = extractVoiceSignals(input);
  const mood = deriveBusinessMood(signals);
  const greeting = getGreeting(period, now);
  const hook = getHook(period, mood, now);
  const lines = buildBriefLines(signals, mood);
  const closer = getCloser(period, mood, now);

  const label =
    period === "morning"
      ? "Morning Brief"
      : period === "evening"
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
    title: "لسه مفيش Orders هنا...",
    description: "يلا نبدأ أول شغلانة 🚀",
  },
  clients: {
    title: "لسه مفيش Clients ظاهرين...",
    description: "ضيف Client جديد، أو وسّع البحث شوية.",
  },
  workspaces: {
    title: "مفيش Workspaces مطابقة...",
    description: "جرّب كلمة تانية — أو افتح lane من الـ sidebar.",
  },
  projects: {
    title: "لسه مفيش Projects هنا...",
    description: "كل فكرة عظيمة بتبدأ بـ Project — يلا نبدأ واحد.",
  },
  files: {
    title: "لسه مفيش Files...",
    description: "أول ما ترفع حاجة، هتظهر هنا على طول.",
  },
  shoots: {
    title: "مفيش shoots قريبة...",
    description: "الجدول فاضي دلوقتي — فرصة ترتّب بهدوء.",
  },
  deliveries: {
    title: "مفيش deliveries قريبة...",
    description: "لما تقرب تسليمة، هتشوفها هنا.",
  },
  deadlines: {
    title: "مفيش deadlines في الـ ١٤ يوم الجايين...",
    description: "هدوّة حلوة — استغلها.",
  },
  payments: {
    title: "لسه مفيش Payments مسجّلة...",
    description: "لما يتسجّل Payment، هتشوفه هنا.",
  },
  team: {
    title: "مفيش فريق متعيّن لسه...",
    description: "عيّن الفريق عشان الشغل يمشي أسرع.",
  },
  attentionClear: {
    title: "كل حاجة تمام ✅",
    description: "مفيش overdue ولا unpaid ولا deadlines ضاغطة.",
  },
  notes: {
    title: "لسه مفيش Notes...",
    description: "اكتب ملاحظة سريعة عشان متضيعش الفكرة.",
  },
  activity: {
    title: "لسه مفيش Activity...",
    description: "أول ما يحصل حركة على الـ Project، هتظهر هنا.",
  },
  deliverables: {
    title: "لسه مفيش Deliverables...",
    description: "لما التسلمات تتحدد، هتلاقيها هنا.",
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
/*  Dashboard section microcopy                                               */
/* -------------------------------------------------------------------------- */

export const DASHBOARD_SECTION_COPY: Record<DashboardSectionKey, SectionCopy> =
  {
    quickActions: {
      title: "Quick Actions",
      description: "اختصارات سريعة... ابدأ من هنا.",
    },
    kpis: {
      title: "Key Metrics",
      description: "نبضة الستوديو في نظرة واحدة.",
    },
    financial: {
      title: "Financial Overview",
      description: "صورة الفلوس بوضوح — من غير لف ودوران.",
    },
    attention: {
      title: "Attention Center",
      description: "تعالى نبص على دول الأول 👀",
    },
    workspaces: {
      title: "Workspace Performance",
      description: "كل مساحة شغل... وقد إيه ماشية.",
    },
    team: {
      title: "Team Performance",
      description: "مين شادّ النهاردة... ومين محتاج دعم.",
    },
    schedule: {
      title: "Upcoming Schedule",
      description: "Shoots، deliveries، و deadlines الجاية.",
    },
    recentOrders: {
      title: "Recent Orders",
      description: "آخر الحجوزات اللي دخلت النظام.",
    },
  };

/** KPI card Arabic whispers — English title stays primary. */
export const KPI_COPY: Record<
  KpiCopyKey,
  { title: string; whisper: string }
> = {
  revenueThisMonth: {
    title: "Revenue this month",
    whisper: "🔥 الدنيا ماشية كويس.",
  },
  revenueLastMonth: {
    title: "Revenue last month",
    whisper: "مرجع الشهر اللي فات.",
  },
  outstanding: {
    title: "Outstanding payments",
    whisper: "فلوس لسه برّه... نلمّها.",
  },
  activeProjects: {
    title: "Active projects",
    whisper: "كل حاجة ماشية حسب الخطة.",
  },
  activeOrders: {
    title: "Active orders",
    whisper: "الـ pipeline صاحي.",
  },
  upcomingShoots: {
    title: "Upcoming shoots",
    whisper: "📸 جهّز الكاميرات...",
  },
  upcomingDeliveries: {
    title: "Upcoming deliveries",
    whisper: "التسليمات الجاية على الرادار.",
  },
  activeClients: {
    title: "Active clients",
    whisper: "عملاء شغّالين معانا دلوقتي.",
  },
};

/** Soft revenue whisper that adapts to MoM without new business logic. */
export function getRevenueWhisper(
  changePct: number | null
): string {
  if (changePct == null) return KPI_COPY.revenueThisMonth.whisper;
  if (changePct >= 10) return "🔥 الدنيا ماشية كويس.";
  if (changePct > 0) return "طالع شوية عن الشهر اللي فات.";
  if (changePct === 0) return "ثابت زي الشهر اللي فات.";
  return "الشهر أهدى شوية — عادي.";
}

export function getOutstandingWhisper(amount: number): string {
  if (amount <= 0) return "مفيش مستحقات معلّقة ✨";
  return KPI_COPY.outstanding.whisper;
}

export function getActiveProjectsWhisper(count: number): string {
  if (count === 0) return "فاضي شوية... فرصة لـ Project جديد.";
  return KPI_COPY.activeProjects.whisper;
}

export function getUpcomingShootsWhisper(count: number): string {
  if (count === 0) return "مفيش shoots قريبة دلوقتي.";
  return KPI_COPY.upcomingShoots.whisper;
}

/* -------------------------------------------------------------------------- */
/*  Project hub section microcopy                                             */
/* -------------------------------------------------------------------------- */

export const HUB_SECTION_COPY: Record<HubSectionCopyKey, SectionCopy> = {
  overview: {
    title: "Overview",
    description: "صورة سريعة عن الـ Project من غير ما تغوص.",
  },
  orders: {
    title: "Orders",
    description: "الحجوزات المربوطة بالـ Project ده.",
  },
  calendar: {
    title: "Calendar",
    description: "Shoots، deliveries، والمواعيد المهمة.",
  },
  files: {
    title: "Files",
    description: "الملفات والمستندات بتاعة الـ Project.",
  },
  payments: {
    title: "Payments",
    description: "الفلوس الداخلة واللي لسه مستنية.",
  },
  timeline: {
    title: "Timeline",
    description: "محطات الـ Project من أول يوم.",
  },
  team: {
    title: "Assigned Team",
    description: "الفريق اللي ماسك الشغلانة دي.",
  },
  notes: {
    title: "Notes",
    description: "ملاحظات سريعة... عشان متضيعش.",
  },
  activity: {
    title: "Activity",
    description: "آخر حركة حصلت على الـ Project.",
  },
  deliverables: {
    title: "Deliverables",
    description: "إيه اللي المفروض يتسلّم... وإيه اللي خلص.",
  },
  upcomingShoots: {
    title: "Upcoming Shoots",
    description: "📸 التصويرات الجاية على الـ Project.",
  },
};
