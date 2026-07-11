/**
 * SODA HUMAN LAYER — Egyptian Arabic business explanations under English titles.
 * Not translations. Not slogans. Ops-manager voice for Egyptian business owners.
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

/** Canonical map — English key → one short Egyptian Arabic business line. */
export const HUMAN_LAYER: Record<HumanLayerKey, string> = {
  /* Modules */
  dashboard: "ملخص الشركة في لحظة واحدة.",
  orders: "كل الشغل الجاري داخل الشركة.",
  projects: "المشاريع اللي شغالين عليها دلوقتي.",
  clients: "قاعدة العملاء — شركات وأفراح.",
  workspaces: "مسارات الشغل التجاري حسب التخصص.",
  projectHub: "تفاصيل المشروع من الطلب للتسليم والدفع.",
  rtm: "مسار RTM التجاري.",
  weddings: "كل شغل الأفراح.",
  fashion: "مسار الفاشن التجاري.",
  product: "مسار تصوير المنتجات.",
  events: "مسار الإيفنتس التجاري.",
  commercial: "كل شغل الشركات والمؤسسات.",
  finance: "ملخص الحسابات الخاصة بيك.",
  quotations: "عروض الأسعار من الاستفسار لحد العربون.",
  about: "قصة صودا والفريق ورا الشغل.",
  login: "ادخل على نظام تشغيل صودا.",
  crew: "فريق صودا اللي بينفذ الشغل.",
  crewProfile: "ملف عضو الفريق — الشغل والمستحقات.",
  calendar: "جدول التصوير والتسليمات من الأوردرات الحية.",

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

/** Resolve a Human Layer line. Unknown keys return empty (callers skip render). */
export function getHumanLayer(key: HumanLayerKey): string {
  return HUMAN_LAYER[key];
}

/** True when a string is a known Human Layer key. */
export function isHumanLayerKey(key: string): key is HumanLayerKey {
  return key in HUMAN_LAYER;
}
