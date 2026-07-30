import type { Locale } from "@/lib/i18n/config";

/** Professional UI chrome — not Side Language, not slang mashups. */
export type Dictionary = {
  nav: {
    home: string;
    brain: string;
    mySpace: string;
    companyWorkspace: string;
    myWorkspace: string;
    quotations: string;
    orders: string;
    myOrders: string;
    projects: string;
    commercial: string;
    weddings: string;
    clients: string;
    crew: string;
    people: string;
    equipment: string;
    calendar: string;
    finance: string;
    statistics: string;
    myWallet: string;
    myTasks: string;
    myAssignedOrders: string;
    mySchedule: string;
    bonus: string;
    target: string;
    penalties: string;
    myPerformance: string;
    connect: string;
    notifications: string;
    settings: string;
  };
  pages: {
    home: string;
    brain: string;
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
    people: string;
    peopleProfile: string;
    finance: string;
    calendar: string;
    equipment: string;
    statistics: string;
    settings: string;
    changePassword: string;
    connect: string;
    notifications: string;
    attention: string;
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
    myProfile: string;
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
  settings: {
    hubTitle: string;
    myProfile: string;
    accountSecurity: string;
    myScope: string;
    myPreferences: string;
    systemSettings: string;
    usernameOrEmail: string;
    twoFactorPlaceholder: string;
    phoneRecoveryBlocked: string;
    profileDesc: string;
    profileNoPerson: string;
    profileCrewLink: string;
    displayName: string;
    saveProfile: string;
    profileSaved: string;
    profileSaveFailed: string;
    profilePhotoUpload: string;
    profilePhotoRemove: string;
    profilePhotoPreview: string;
    profilePhotoInitials: string;
    profilePhotoMimeError: string;
    profilePhotoSizeError: string;
    profilePhotoCropError: string;
    username: string;
    emailReadOnly: string;
    twoFactorUnavailable: string;
    twoFactorExplanation: string;
    phoneLoginBlocked: string;
    phoneLoginExplanation: string;
    smsRecoveryBlocked: string;
    scopeDesc: string;
    accessLevel: string;
    jobTitleDisplay: string;
    permissions: string;
    scopeFootnote: string;
    languageTitle: string;
    languageDesc: string;
    appearanceTitle: string;
    appearanceDesc: string;
    motionTitle: string;
    motionDesc: string;
    motionSystem: string;
    motionReduce: string;
    motionFull: string;
    notificationsDesc: string;
    openNotifications: string;
    accountDesc: string;
    systemCompanyEmail: string;
    systemAuthority: string;
    systemAuthorityDesc: string;
    systemBackup: string;
    systemBackupDesc: string;
    systemInvite: string;
    systemInviteDesc: string;
    openAuthority: string;
    openBackup: string;
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
    brain: string;
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
    connect: string;
    notifications: string;
    attention: string;
    schedule: string;
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
    home: "Home Screen",
    brain: "SODA Brain",
    mySpace: "My Space",
    companyWorkspace: "Company Workspace",
    myWorkspace: "My Workspace",
    quotations: "Quotations",
    orders: "Orders",
    myOrders: "My Orders",
    projects: "Projects (by Client)",
    commercial: "Commercial",
    weddings: "Weddings",
    clients: "Clients",
    crew: "Crew",
    people: "Crew",
    equipment: "Equipment",
    calendar: "Calendar",
    finance: "Finance",
    statistics: "Statistics",
    myWallet: "My Wallet",
    myTasks: "My Tasks",
    myAssignedOrders: "My Assigned Orders",
    mySchedule: "My Schedule",
    bonus: "Bonus",
    target: "Target",
    penalties: "Penalties",
    myPerformance: "My Performance",
    connect: "Team Chat",
    notifications: "Notifications",
    settings: "Settings",
  },
  pages: {
    home: "Home Screen",
    brain: "SODA Brain",
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
    people: "Crew",
    peopleProfile: "Crew Workspace",
    finance: "Finance",
    calendar: "Calendar",
    equipment: "Equipment",
    statistics: "Statistics",
    settings: "Settings",
    changePassword: "Change Password",
    connect: "Team Chat",
    notifications: "Notifications",
    attention: "Need Attention",
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
    createClient: "+ New Client",
    createOrder: "+ New Order",
    createProject: "+ New Project",
    createPerson: "Create Person",
    createCrew: "+ New Crew",
    createQuotation: "+ New Quotation",
    createDelivery: "Create Delivery",
    createInvoice: "Create Invoice",
    saveChanges: "Save Changes",
    newQuotation: "+ New Quotation",
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
    myProfile: "My Profile",
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
  settings: {
    hubTitle: "Account settings",
    myProfile: "My Profile",
    accountSecurity: "Account & Security",
    myScope: "My Scope",
    myPreferences: "My Preferences",
    systemSettings: "System Settings",
    usernameOrEmail: "Username or email",
    twoFactorPlaceholder: "Two-factor authentication — coming soon",
    phoneRecoveryBlocked: "Phone recovery requires SMS configuration (not enabled)",
    profileDesc: "Personal identity — photo and display name. Job title is Founder-managed.",
    profileNoPerson: "No crew profile linked. Ask Founder to link your login to a crew record.",
    profileCrewLink: "Full crew workspace (Founder view)",
    displayName: "Display name",
    saveProfile: "Save profile",
    profileSaved: "Profile updated.",
    profileSaveFailed: "Save failed.",
    profilePhotoUpload: "Upload photo",
    profilePhotoRemove: "Remove photo",
    profilePhotoPreview: "Photo preview",
    profilePhotoInitials: "Initials fallback when no photo",
    profilePhotoMimeError: "Only JPEG, PNG, or WebP images are allowed.",
    profilePhotoSizeError: "Image must be 2 MB or smaller.",
    profilePhotoCropError: "Could not process image.",
    username: "Username",
    emailReadOnly: "Email is managed by Auth — contact Founder for account email changes.",
    twoFactorUnavailable: "Two-factor authentication unavailable",
    twoFactorExplanation: "2FA is not implemented in this release. Password + email login is supported.",
    phoneLoginBlocked: "Phone login not supported",
    phoneLoginExplanation:
      "Login accepts username or email only. Supabase Auth has no verified phone identifier or E.164 resolver configured.",
    smsRecoveryBlocked: "SMS recovery not supported",
    scopeDesc: "Read-only — access level, role, and permissions.",
    accessLevel: "Access Level",
    jobTitleDisplay: "Job title (display)",
    permissions: "Permissions",
    scopeFootnote: "No client directory here — order assignments define your work scope.",
    languageTitle: "Language",
    languageDesc: "English · العربية — saved on this device",
    appearanceTitle: "Appearance",
    appearanceDesc: "Light · Dark · System",
    motionTitle: "Motion",
    motionDesc: "User preference overrides system reduced-motion when set",
    motionSystem: "System",
    motionReduce: "Reduce motion",
    motionFull: "Full motion",
    notificationsDesc: "In-app notification center",
    openNotifications: "Open Notifications →",
    accountDesc: "Auth-owned credentials.",
    systemCompanyEmail: "Company email domain",
    systemAuthority: "Authority Center",
    systemAuthorityDesc: "Manage accounts, roles, and permissions.",
    systemBackup: "Backup Center",
    systemBackupDesc: "Founder-only recoverability",
    systemInvite: "Invite user (email)",
    systemInviteDesc: "Prefer Create Login Account in Crew Workspace.",
    openAuthority: "Open Authority Center →",
    openBackup: "Open Backup Center →",
  },
  quickActions: {
    newQuotation: "+ New Quotation",
    createOrder: "+ New Order",
    createClient: "+ New Client",
    crew: "Crew",
    commercial: "Commercial",
    calendar: "Calendar",
    reports: "Statistics",
  },
  crumbs: {
    home: "Home Screen",
    brain: "SODA Brain",
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
    connect: "Team Chat",
    notifications: "Notifications",
    attention: "Need Attention",
    schedule: "Timeline",
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
    home: "الشاشة الرئيسية",
    brain: "SODA Brain",
    mySpace: "مساحتي",
    companyWorkspace: "مساحة الشركة",
    myWorkspace: "مساحتي",
    quotations: "عروض الأسعار",
    orders: "الأوردرات",
    myOrders: "أوردراتي",
    projects: "المشاريع (حسب العميل)",
    commercial: "التجاري",
    weddings: "الأفراح",
    clients: "العملاء",
    crew: "الفريق",
    people: "الفريق",
    equipment: "المعدات",
    calendar: "الجدول",
    finance: "المالية",
    statistics: "الإحصائيات",
    myWallet: "محفظتي",
    myTasks: "مهامي",
    myAssignedOrders: "أوردراتي",
    mySchedule: "جدولي",
    bonus: "البونص",
    target: "التارجيت",
    penalties: "الجزاءات",
    myPerformance: "أدائي",
    connect: "Team Chat",
    notifications: "التنبيهات",
    settings: "الإعدادات",
  },
  pages: {
    home: "الشاشة الرئيسية",
    brain: "SODA Brain",
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
    people: "الفريق",
    peopleProfile: "مساحة الفريق",
    finance: "المالية",
    calendar: "الجدول",
    equipment: "المعدات",
    statistics: "الإحصائيات",
    settings: "الإعدادات",
    changePassword: "تغيير كلمة السر",
    connect: "Team Chat",
    notifications: "التنبيهات",
    attention: "محتاج انتباه",
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
    createClient: "+ عميل جديد",
    createOrder: "+ أوردر جديد",
    createProject: "+ مشروع جديد",
    createPerson: "إنشاء شخص",
    createCrew: "+ عضو فريق جديد",
    createQuotation: "+ عرض سعر جديد",
    createDelivery: "إنشاء تسليم",
    createInvoice: "إنشاء فاتورة",
    saveChanges: "حفظ التعديلات",
    newQuotation: "+ عرض سعر جديد",
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
    myProfile: "ملفي الشخصي",
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
  settings: {
    hubTitle: "إعدادات الحساب",
    myProfile: "ملفي الشخصي",
    accountSecurity: "الحساب والأمان",
    myScope: "نطاقي",
    myPreferences: "تفضيلاتي",
    systemSettings: "إعدادات النظام",
    usernameOrEmail: "اسم المستخدم أو البريد",
    twoFactorPlaceholder: "المصادقة الثنائية — قريباً",
    phoneRecoveryBlocked: "استعادة الهاتف تتطلب إعداد الرسائل (غير مفعّل)",
    profileDesc: "الهوية الشخصية — الصورة واسم العرض. المسمى الوظيفي يُدار من المؤسس.",
    profileNoPerson: "لا يوجد ملف فريق مرتبط. اطلب من المؤسس ربط حسابك بسجل الفريق.",
    profileCrewLink: "مساحة الفريق الكاملة (عرض المؤسس)",
    displayName: "اسم العرض",
    saveProfile: "حفظ الملف",
    profileSaved: "تم تحديث الملف.",
    profileSaveFailed: "فشل الحفظ.",
    profilePhotoUpload: "رفع صورة",
    profilePhotoRemove: "إزالة الصورة",
    profilePhotoPreview: "معاينة الصورة",
    profilePhotoInitials: "الأحرف الأولى عند عدم وجود صورة",
    profilePhotoMimeError: "يُسمح فقط بصور JPEG أو PNG أو WebP.",
    profilePhotoSizeError: "يجب ألا يتجاوز حجم الصورة 2 ميجابايت.",
    profilePhotoCropError: "تعذّر معالجة الصورة.",
    username: "اسم المستخدم",
    emailReadOnly: "البريد يُدار عبر Auth — تواصل مع المؤسس لتغيير بريد الحساب.",
    twoFactorUnavailable: "المصادقة الثنائية غير متاحة",
    twoFactorExplanation: "المصادقة الثنائية غير مفعّلة. تسجيل الدخول بالبريد وكلمة السر مدعوم.",
    phoneLoginBlocked: "تسجيل الدخول بالهاتف غير مدعوم",
    phoneLoginExplanation:
      "تسجيل الدخول باسم المستخدم أو البريد فقط. لا يوجد معرّف هاتف موثّق أو محوّل E.164 في Auth.",
    smsRecoveryBlocked: "استعادة عبر SMS غير مدعومة",
    scopeDesc: "للقراءة فقط — مستوى الوصول والدور والصلاحيات.",
    accessLevel: "مستوى الوصول",
    jobTitleDisplay: "المسمى الوظيفي (عرض)",
    permissions: "الصلاحيات",
    scopeFootnote: "لا يوجد دليل عملاء هنا — نطاق عملك يُحدده الأوردرات المعيّنة.",
    languageTitle: "اللغة",
    languageDesc: "English · العربية — تُحفظ على هذا الجهاز",
    appearanceTitle: "المظهر",
    appearanceDesc: "فاتح · داكن · النظام",
    motionTitle: "الحركة",
    motionDesc: "تفضيل المستخدم يتجاوز إعداد النظام عند التعيين",
    motionSystem: "النظام",
    motionReduce: "تقليل الحركة",
    motionFull: "حركة كاملة",
    notificationsDesc: "مركز التنبيهات داخل التطبيق",
    openNotifications: "فتح التنبيهات ←",
    accountDesc: "بيانات اعتماد Auth.",
    systemCompanyEmail: "نطاق بريد الشركة",
    systemAuthority: "مركز الصلاحيات",
    systemAuthorityDesc: "إدارة الحسابات والأدوار والصلاحيات.",
    systemBackup: "مركز النسخ الاحتياطي",
    systemBackupDesc: "للمؤسس فقط",
    systemInvite: "دعوة مستخدم (بريد)",
    systemInviteDesc: "يُفضّل إنشاء حساب من مساحة الفريق.",
    openAuthority: "فتح مركز الصلاحيات ←",
    openBackup: "فتح مركز النسخ الاحتياطي ←",
  },
  quickActions: {
    newQuotation: "+ عرض سعر",
    createOrder: "+ أوردر جديد",
    createClient: "+ عميل جديد",
    crew: "الفريق",
    commercial: "التجاري",
    calendar: "الجدول",
    reports: "الإحصائيات",
  },
  crumbs: {
    home: "الشاشة الرئيسية",
    brain: "SODA Brain",
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
    connect: "Team Chat",
    notifications: "التنبيهات",
    attention: "محتاج انتباه",
    schedule: "الجدول الزمني",
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
