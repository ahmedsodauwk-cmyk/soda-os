import type { Locale } from "@/lib/i18n/config";

/** Professional UI chrome — not Side Language, not slang mashups. */
export type Dictionary = {
  nav: {
    home: string;
    mySpace: string;
    quotations: string;
    orders: string;
    projects: string;
    commercial: string;
    weddings: string;
    clients: string;
    crew: string;
    equipment: string;
    calendar: string;
    finance: string;
    statistics: string;
    myWallet: string;
    bonus: string;
    target: string;
    penalties: string;
    myFiles: string;
    briefs: string;
    dressCode: string;
    myPerformance: string;
    notifications: string;
    settings: string;
  };
  pages: {
    home: string;
    clients: string;
    weddingClients: string;
    commercialClients: string;
    orders: string;
    weddingOrders: string;
    commercialOrders: string;
    projects: string;
    project: string;
    commercial: string;
    quotations: string;
    newQuotation: string;
    quotation: string;
    crew: string;
    crewProfile: string;
    finance: string;
    calendar: string;
    equipment: string;
    statistics: string;
    settings: string;
    changePassword: string;
    notifications: string;
    mySpace: string;
    myWallet: string;
    about: string;
    login: string;
    order: string;
    client: string;
  };
  actions: {
    save: string;
    saving: string;
    cancel: string;
    create: string;
    creating: string;
    delete: string;
    edit: string;
    createClient: string;
    createOrder: string;
    createProject: string;
    createPerson: string;
    createCrew: string;
    createQuotation: string;
    createDelivery: string;
    createInvoice: string;
    saveChanges: string;
    newQuotation: string;
    signIn: string;
    signingIn: string;
    logOut: string;
    openMenu: string;
  };
  common: {
    language: string;
    english: string;
    arabic: string;
    myAccount: string;
    profile: string;
    settings: string;
    changePassword: string;
    aboutSoda: string;
    storage: string;
    email: string;
    password: string;
    forgotPassword: string;
    firstOwnerSetup: string;
    search: string;
  };
  quickActions: {
    newQuotation: string;
    createOrder: string;
    createClient: string;
    crew: string;
    commercial: string;
    calendar: string;
    reports: string;
  };
  crumbs: {
    home: string;
    orders: string;
    projects: string;
    clients: string;
    crew: string;
    people: string;
    finance: string;
    calendar: string;
    commercial: string;
    quotations: string;
    equipment: string;
    statistics: string;
    settings: string;
    notifications: string;
    me: string;
    wallet: string;
    bonus: string;
    target: string;
    penalties: string;
    files: string;
    briefs: string;
    dressCode: string;
    performance: string;
    weddings: string;
    about: string;
    login: string;
    password: string;
    new: string;
  };
};

const en: Dictionary = {
  nav: {
    home: "Home",
    mySpace: "My Space",
    quotations: "Quotations",
    orders: "Orders",
    projects: "Projects",
    commercial: "Commercial",
    weddings: "Weddings",
    clients: "Clients",
    crew: "Crew",
    equipment: "Equipment",
    calendar: "Calendar",
    finance: "Finance",
    statistics: "Statistics",
    myWallet: "My Wallet",
    bonus: "Bonus",
    target: "Target",
    penalties: "Penalties",
    myFiles: "My Files",
    briefs: "Briefs",
    dressCode: "Dress Code",
    myPerformance: "My Performance",
    notifications: "Notifications",
    settings: "Settings",
  },
  pages: {
    home: "Home",
    clients: "Clients",
    weddingClients: "Wedding Clients",
    commercialClients: "Commercial Clients",
    orders: "Orders",
    weddingOrders: "Wedding Orders",
    commercialOrders: "Commercial Orders",
    projects: "Projects",
    project: "Project",
    commercial: "Commercial",
    quotations: "Quotations",
    newQuotation: "New Quotation",
    quotation: "Quotation",
    crew: "Crew",
    crewProfile: "Crew Profile",
    finance: "Finance",
    calendar: "Calendar",
    equipment: "Equipment",
    statistics: "Statistics",
    settings: "Settings",
    changePassword: "Change Password",
    notifications: "Notifications",
    mySpace: "My Space",
    myWallet: "My Wallet",
    about: "About",
    login: "Sign in",
    order: "Order",
    client: "Client",
  },
  actions: {
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    create: "Create",
    creating: "Creating…",
    delete: "Delete",
    edit: "Edit",
    createClient: "Create Client",
    createOrder: "Create Order",
    createProject: "Create Project",
    createPerson: "Create Person",
    createCrew: "Create Crew Member",
    createQuotation: "Create Quotation",
    createDelivery: "Create Delivery",
    createInvoice: "Create Invoice",
    saveChanges: "Save Changes",
    newQuotation: "New Quotation",
    signIn: "Sign in",
    signingIn: "Signing in…",
    logOut: "Log out",
    openMenu: "Open menu",
  },
  common: {
    language: "Language",
    english: "English",
    arabic: "العربية",
    myAccount: "My Account",
    profile: "Profile",
    settings: "Settings",
    changePassword: "Change password",
    aboutSoda: "About SODA VISUALS",
    storage: "Storage",
    email: "Email",
    password: "Password",
    forgotPassword: "Forgot password?",
    firstOwnerSetup: "First owner setup",
    search: "Search",
  },
  quickActions: {
    newQuotation: "New Quotation",
    createOrder: "Create Order",
    createClient: "Create Client",
    crew: "Crew",
    commercial: "Commercial",
    calendar: "Calendar",
    reports: "Statistics",
  },
  crumbs: {
    home: "Home",
    orders: "Orders",
    projects: "Projects",
    clients: "Clients",
    crew: "Crew",
    people: "Crew",
    finance: "Finance",
    calendar: "Calendar",
    commercial: "Commercial",
    quotations: "Quotations",
    equipment: "Equipment",
    statistics: "Statistics",
    settings: "Settings",
    notifications: "Notifications",
    me: "My Space",
    wallet: "Wallet",
    bonus: "Bonus",
    target: "Target",
    penalties: "Penalties",
    files: "Files",
    briefs: "Briefs",
    dressCode: "Dress Code",
    performance: "Performance",
    weddings: "Weddings",
    about: "About",
    login: "Sign in",
    password: "Password",
    new: "New",
  },
};

const ar: Dictionary = {
  nav: {
    home: "الرئيسية",
    mySpace: "مساحتي",
    quotations: "عروض الأسعار",
    orders: "الأوردرات",
    projects: "المشاريع",
    commercial: "التجاري",
    weddings: "الأفراح",
    clients: "العملاء",
    crew: "الفريق",
    equipment: "المعدات",
    calendar: "الجدول",
    finance: "المالية",
    statistics: "الإحصائيات",
    myWallet: "محفظتي",
    bonus: "البونص",
    target: "التارجيت",
    penalties: "الجزاءات",
    myFiles: "ملفاتي",
    briefs: "البريفز",
    dressCode: "الدريس كود",
    myPerformance: "أدائي",
    notifications: "التنبيهات",
    settings: "الإعدادات",
  },
  pages: {
    home: "الرئيسية",
    clients: "العملاء",
    weddingClients: "عملاء الأفراح",
    commercialClients: "العملاء التجاريون",
    orders: "الأوردرات",
    weddingOrders: "أوردرات الأفراح",
    commercialOrders: "الأوردرات التجارية",
    projects: "المشاريع",
    project: "مشروع",
    commercial: "التجاري",
    quotations: "عروض الأسعار",
    newQuotation: "عرض سعر جديد",
    quotation: "عرض سعر",
    crew: "الفريق",
    crewProfile: "ملف الفريق",
    finance: "المالية",
    calendar: "الجدول",
    equipment: "المعدات",
    statistics: "الإحصائيات",
    settings: "الإعدادات",
    changePassword: "تغيير كلمة السر",
    notifications: "التنبيهات",
    mySpace: "مساحتي",
    myWallet: "محفظتي",
    about: "عن صودا",
    login: "تسجيل الدخول",
    order: "أوردر",
    client: "عميل",
  },
  actions: {
    save: "حفظ",
    saving: "جاري الحفظ…",
    cancel: "إلغاء",
    create: "إنشاء",
    creating: "جاري الإنشاء…",
    delete: "حذف",
    edit: "تعديل",
    createClient: "إنشاء عميل",
    createOrder: "إنشاء أوردر",
    createProject: "إنشاء مشروع",
    createPerson: "إنشاء شخص",
    createCrew: "إنشاء عضو فريق",
    createQuotation: "إنشاء عرض سعر",
    createDelivery: "إنشاء تسليم",
    createInvoice: "إنشاء فاتورة",
    saveChanges: "حفظ التعديلات",
    newQuotation: "عرض سعر جديد",
    signIn: "دخول",
    signingIn: "جاري الدخول…",
    logOut: "تسجيل الخروج",
    openMenu: "فتح القائمة",
  },
  common: {
    language: "اللغة",
    english: "English",
    arabic: "العربية",
    myAccount: "حسابي",
    profile: "الملف الشخصي",
    settings: "الإعدادات",
    changePassword: "تغيير كلمة السر",
    aboutSoda: "عن SODA VISUALS",
    storage: "التخزين",
    email: "البريد",
    password: "كلمة السر",
    forgotPassword: "نسيت كلمة السر؟",
    firstOwnerSetup: "إعداد المالك الأول",
    search: "بحث",
  },
  quickActions: {
    newQuotation: "عرض سعر",
    createOrder: "إنشاء أوردر",
    createClient: "إنشاء عميل",
    crew: "الفريق",
    commercial: "التجاري",
    calendar: "الجدول",
    reports: "الإحصائيات",
  },
  crumbs: {
    home: "الرئيسية",
    orders: "الأوردرات",
    projects: "المشاريع",
    clients: "العملاء",
    crew: "الفريق",
    people: "الفريق",
    finance: "المالية",
    calendar: "الجدول",
    commercial: "التجاري",
    quotations: "عروض الأسعار",
    equipment: "المعدات",
    statistics: "الإحصائيات",
    settings: "الإعدادات",
    notifications: "التنبيهات",
    me: "مساحتي",
    wallet: "محفظتي",
    bonus: "البونص",
    target: "التارجيت",
    penalties: "الجزاءات",
    files: "ملفاتي",
    briefs: "البريفز",
    dressCode: "الدريس كود",
    performance: "أدائي",
    weddings: "الأفراح",
    about: "عن صودا",
    login: "تسجيل الدخول",
    password: "كلمة السر",
    new: "جديد",
  },
};

export const dictionaries: Record<Locale, Dictionary> = { en, ar };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

type PathImpl<T, Key extends keyof T> = Key extends string
  ? T[Key] extends Record<string, unknown>
    ? `${Key}.${PathImpl<T[Key], keyof T[Key] & string>}`
    : `${Key}`
  : never;

export type DictKey = PathImpl<Dictionary, keyof Dictionary>;

export function getDictValue(dict: Dictionary, key: DictKey): string {
  const parts = key.split(".");
  let cur: unknown = dict;
  for (const part of parts) {
    if (cur && typeof cur === "object" && part in cur) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return typeof cur === "string" ? cur : key;
}
