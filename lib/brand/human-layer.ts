/**
 * SODA Side Language — Egyptian Arabic human explanations under UI titles.
 * NEVER follows UI language. Not translations. Not slogans.
 * Max ~2 short lines. Calm teammate voice for Egyptian studio owners.
 */

export type HumanLayerKey =
  /* Modules / pages */
  | "dashboard"
  | "orders"
  | "projects"
  | "clients"
  | "workspaces"
  | "projectHub"
  | "rtm"
  | "weddings"
  | "fashion"
  | "product"
  | "events"
  | "commercial"
  | "finance"
  | "quotations"
  | "about"
  | "login"
  | "crew"
  | "crewProfile"
  | "calendar"
  | "statistics"
  | "equipment"
  | "settings"
  | "notifications"
  | "mySpace"
  | "myWallet"
  /* Dashboard sections */
  | "companyPulse"
  | "sodaLive"
  | "financialSummary"
  | "quickActions"
  | "attention"
  | "schedule"
  | "recentOrders"
  | "commercialLanes"
  | "crewWorkload"
  | "operations"
  | "owedToCrew"
  /* Finance / metrics */
  | "outstandingBalance"
  | "currentMonthEarnings"
  | "totalDue"
  | "paid"
  | "outstanding"
  | "revenue"
  | "invoices"
  | "recordPayment"
  | "paymentHistory"
  | "deposits"
  | "remaining"
  | "collected"
  | "revenueThisMonth"
  | "revenueLastMonth"
  | "outstandingPayments"
  | "activeProjects"
  | "activeOrders"
  | "upcomingShoots"
  | "upcomingDeliveries"
  | "activeClients"
  /* Project hub */
  | "hubOverview"
  | "hubOrders"
  | "hubCalendar"
  | "hubFiles"
  | "hubPayments"
  | "hubTimeline"
  | "hubTeam"
  | "hubNotes"
  | "hubActivity"
  | "hubDeliverables"
  | "hubUpcomingShoots"
  /* Quotations */
  | "quotationPipeline"
  | "quotationProjectInfo"
  | "quotationServices"
  | "quotationDiscountTax"
  | "quotationTimeline"
  | "quotationDeliverables"
  | "quotationPaymentPlan"
  | "quotationTerms"
  | "quotationPreview"
  | "quotationApproval"
  | "versionHistory"
  | "allQuotations"
  | "newQuotation"
  /* Hubs / lanes */
  | "weddingClients"
  | "commercialClients"
  | "weddingOrders"
  | "commercialOrders"
  /* Profile sections */
  | "projectsSection"
  | "ordersSection"
  | "invoicesPayments"
  | "deliveriesFiles"
  | "monthlyAccount"
  | "orderBasedPayments"
  | "deliveries";

/** Canonical map — English key → SODA Side Language (Egyptian Arabic, ≤2 lines). */
export const HUMAN_LAYER: Record<HumanLayerKey, string> = {
  /* Modules — Side Language (identity of SODA VISUALS) */
  dashboard:
    "دي نظرة سريعة على اللي مستنيك النهارده.\nالأولويات، الشغل الحي، وحركة الشركة.",
  orders:
    "كل شغل الشركة بيبدأ من هنا.\nتابع الأوردرات، الفريق، وحالة التنفيذ.",
  projects: "كل مشروع ليه رحلته.\nمن أول الاتفاق لحد التسليم.",
  clients:
    "هنا هتلاقي كل عملاء الشركة.\nضيف عميل جديد أو كمل شغلك مع عميل موجود.",
  workspaces: "مسارات الشغل التجاري حسب التخصص.\nاختار المسار وكمل من مكانه.",
  projectHub: "تفاصيل المشروع من الاتفاق للتسليم والدفع.\nكل حاجة في مكان واحد.",
  rtm: "مسار RTM التجاري.\nشوف الشغل والحساب من هنا.",
  weddings: "كل شغل الأفراح.\nالعملاء والأوردرات والمواعيد.",
  fashion: "مسار الفاشن التجاري.\nالشغل والحساب في سطر واحد.",
  product: "مسار تصوير المنتجات.\nمن الأوردر لحد التسليم.",
  events: "مسار الإيفنتس التجاري.\nتابع التنفيذ والحساب هنا.",
  commercial: "كل شغل الشركات والمؤسسات.\nالمسارات، الأوردرات، والعملاء.",
  finance:
    "هنا هتتابع فلوس الشركة كلها.\nالتحصيلات، المصروفات، الأرباح، وحركة الحسابات.",
  quotations: "عروض الأسعار من الاستفسار لحد العربون.\nابنِ العرض وحوّله لأوردر.",
  about: "قصة صودا والفريق ورا الشغل.\nإزاي بنشتغل ولماذا.",
  login: "ادخل على SODA VISUALS.\nنظام تشغيل الاستوديو للشغل مرتّب.",
  crew: "كل بيانات الفريق في مكان واحد.\nشوف المهام، الأرباح، والأداء.",
  crewProfile: "ملف عضو الفريق.\nالشغل، المستحقات، والأداء.",
  calendar: "جدول التصوير والتسليمات.\nمن الأوردرات الحية مباشرة.",
  statistics: "لو عايز تعرف الشركة ماشية إزاي،\nابدأ من هنا.",
  equipment: "الكاميرات والعدسات والعدة.\nمين معاه إيه، وإيه فاضي.",
  settings: "الحساب، اللغة، وكلمة السر.\nوصلاحيات الفريق لو محتاج.",
  notifications: "تنبيهات الأوردرات والعملاء والمالية.\nاللي محتاج نظرة بسرعة.",
  mySpace: "مساحتك الشخصية في صودا.\nالشوتات، المحفظة، والتارجيت.",
  myWallet: "مستحقاتك والمدفوع من الشغل.\nمحفظة واضحة من غير لف.",

  /* Dashboard */
  companyPulse: "أهم الحاجات اللي محتاجة انتباه دلوقتي.",
  sodaLive: "آخر اللي حصل في الشركة لحظة بلحظة.",
  financialSummary: "ملخص الحسابات الخاصة بيك.",
  quickActions: "اختصارات للشغل اليومي.",
  attention: "حاجات ضغط محتاجة قرار دلوقتي.",
  schedule: "جدول الشوتات والتسليمات والمواعيد.",
  recentOrders: "آخر الأوردرات اللي دخلت النظام.",
  commercialLanes: "أداء المسارات التجارية.",
  crewWorkload: "تحميل الشغل على فريق صودا.",
  operations: "أرقام التشغيل الحية من الشغل الجاري.",
  owedToCrew: "مستحقات الفريق اللي لسه متدفعتش.",

  /* Finance */
  outstandingBalance: "لسه ليك فلوس عند العميل.",
  currentMonthEarnings: "دي مستحقات الشهر الحالي قبل أي دفعات.",
  totalDue: "إجمالي اللي المفروض يتصرف.",
  paid: "اللي اتدفع بالفعل.",
  outstanding: "المتبقي لسه.",
  revenue: "إجمالي دخل الشركة.",
  invoices: "الفواتير الخاصة بالعميل.",
  recordPayment: "سجل الدفعة عشان الحسابات تتحدث.",
  paymentHistory: "كل الدفعات اللي اتسجلت قبل كده.",
  deposits: "العربونات اللي اتجمعت.",
  remaining: "الباقي لسه على الحساب.",
  collected: "اللي اتجمّع فعليًا في الخزنة.",
  revenueThisMonth: "دخل الشهر الحالي من الشغل المحجوز.",
  revenueLastMonth: "دخل الشهر اللي فات للمقارنة.",
  outstandingPayments: "لسه ليك فلوس عند العملاء.",
  activeProjects: "المشاريع المفتوحة دلوقتي.",
  activeOrders: "الأوردرات اللي لسه شغّالة.",
  upcomingShoots: "الشوتات الجاية في الجدول.",
  upcomingDeliveries: "التسليمات اللي قرب معادها.",
  activeClients: "العملاء اللي عندهم شغل أو رصيد مفتوح.",

  /* Project hub */
  hubOverview: "حالة المشروع والرحلة والتواريخ المهمة.",
  hubOrders: "الأوردرات المرتبطة بالمشروع ده.",
  hubCalendar: "الشوتات والتسليمات والمواعيد.",
  hubFiles: "ملفات ومستندات المشروع.",
  hubPayments: "المحصّل والمتبقي على المشروع.",
  hubTimeline: "محطات المشروع خطوة بخطوة.",
  hubTeam: "فريق صودا المعيّن على المشروع.",
  hubNotes: "ملاحظات التشغيل على المشروع.",
  hubActivity: "آخر اللي حصل على المشروع.",
  hubDeliverables: "المطلوب والمخلّص من التسليمات.",
  hubUpcomingShoots: "الشوتات المجدولة على المشروع.",

  /* Quotations */
  quotationPipeline: "حالة عروض الأسعار في البايبلاين.",
  quotationProjectInfo: "بيانات المشروع الأساسية للعرض.",
  quotationServices: "الخدمات والملاحظات داخل العرض.",
  quotationDiscountTax: "الخصم والضريبة على الإجمالي.",
  quotationTimeline: "جدول التنفيذ المتفق عليه.",
  quotationDeliverables: "إيه اللي هيتسلّم للعميل.",
  quotationPaymentPlan: "خطة الدفع على مراحل.",
  quotationTerms: "شروط التعامل في العرض.",
  quotationPreview: "معاينة العرض قبل ما يتبعت.",
  quotationApproval: "الموافقة وتحويل العرض لأوردر.",
  versionHistory: "نسخ العرض السابقة.",
  allQuotations: "كل عروض الأسعار في النظام.",
  newQuotation: "افتح عرض سعر جديد للعميل.",

  /* Hubs */
  weddingClients: "عملاء الأفراح — بحث وجديد وقديم.",
  commercialClients: "شركات ومؤسسات — الحساب الكامل.",
  weddingOrders: "أوردرات الأفراح حسب السنة والشهر.",
  commercialOrders: "أوردرات الشركات من المشروع للفاتورة.",

  /* Profile sections */
  projectsSection: "المشاريع اللي شغالين عليها دلوقتي.",
  ordersSection: "كل الشغل الجاري داخل الشركة.",
  invoicesPayments: "الفواتير والدفعات بتاعة العميل.",
  deliveriesFiles: "التسليمات والملفات المرتبطة.",
  monthlyAccount: "تسوية حساب الشهر الحالي.",
  orderBasedPayments: "مستحقات من التعيينات على الأوردرات.",
  deliveries: "التسليمات المرتبطة بالشغل ده.",
};

/** Alias — SODA Side Language is the human layer. */
export const SIDE_LANGUAGE = HUMAN_LAYER;

/** Resolve a Side Language line. Unknown keys return empty (callers skip render). */
export function getHumanLayer(key: HumanLayerKey): string {
  return HUMAN_LAYER[key];
}

export function getSideLanguage(key: HumanLayerKey): string {
  return HUMAN_LAYER[key];
}

/** True when a string is a known Human Layer / Side Language key. */
export function isHumanLayerKey(key: string): key is HumanLayerKey {
  return key in HUMAN_LAYER;
}
