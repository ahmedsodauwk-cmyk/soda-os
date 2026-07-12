/**
 * Role-filtered navigation — sidebar / mobile menu.
 * Titles use SODA Voice (Egyptian Arabic) + light emoji cues.
 */

import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ShoppingCart,
  Briefcase,
  Heart,
  Users,
  UsersRound,
  Calendar,
  DollarSign,
  Settings,
  FileText,
  FolderKanban,
  Camera,
  BarChart3,
  Wallet,
  Target,
  Gift,
  AlertTriangle,
  FolderOpen,
  ScrollText,
  Shirt,
  TrendingUp,
  Bell,
  User,
} from "lucide-react";

import { can, type Permission } from "@/lib/identity/permissions";
import type { SodaRole } from "@/lib/identity/roles";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** All required; item shown if role has any listed permission */
  anyOf: Permission[];
};

export const NAV_ITEMS: NavItem[] = [
  {
    title: "⚡ نظرة سريعة",
    href: "/",
    icon: LayoutDashboard,
    anyOf: [
      "dashboard.company",
      "dashboard.team",
      "dashboard.crew",
      "dashboard.finance",
    ],
  },
  {
    title: "👤 مساحتي",
    href: "/me",
    icon: User,
    anyOf: ["dashboard.crew"],
  },
  {
    title: "📄 عروض الأسعار",
    href: "/quotations",
    icon: FileText,
    anyOf: ["quotations.view"],
  },
  {
    title: "📸 الأوردرات",
    href: "/orders",
    icon: ShoppingCart,
    anyOf: ["orders.view"],
  },
  {
    title: "📁 المشاريع",
    href: "/projects",
    icon: FolderKanban,
    anyOf: ["projects.view"],
  },
  {
    title: "🏢 التجاري",
    href: "/commercial",
    icon: Briefcase,
    anyOf: ["commercial.view"],
  },
  {
    title: "💍 الأفراح",
    href: "/orders/weddings",
    icon: Heart,
    anyOf: ["orders.view", "dashboard.company"],
  },
  {
    title: "🤝 العملاء",
    href: "/clients",
    icon: Users,
    anyOf: ["clients.view"],
  },
  {
    title: "🎥 الفريق",
    href: "/crew",
    icon: UsersRound,
    anyOf: ["crew.view", "crew.stats"],
  },
  {
    title: "📷 المعدات",
    href: "/equipment",
    icon: Camera,
    anyOf: ["equipment.view"],
  },
  {
    title: "📅 الجدول",
    href: "/calendar",
    icon: Calendar,
    anyOf: ["calendar.view"],
  },
  {
    title: "💰 المالية",
    href: "/finance",
    icon: DollarSign,
    anyOf: ["finance.view", "dashboard.finance"],
  },
  {
    title: "📊 الإحصائيات",
    href: "/statistics",
    icon: BarChart3,
    anyOf: ["statistics.view"],
  },
  {
    title: "💳 محفظتي",
    href: "/me/wallet",
    icon: Wallet,
    anyOf: ["me.wallet"],
  },
  {
    title: "🎁 البونص",
    href: "/me/bonus",
    icon: Gift,
    anyOf: ["me.bonus"],
  },
  {
    title: "🎯 التارجيت",
    href: "/me/target",
    icon: Target,
    anyOf: ["me.target"],
  },
  {
    title: "⚠️ الجزاءات",
    href: "/me/penalties",
    icon: AlertTriangle,
    anyOf: ["me.penalties"],
  },
  {
    title: "📂 ملفاتي",
    href: "/me/files",
    icon: FolderOpen,
    anyOf: ["me.files"],
  },
  {
    title: "📝 البريفز",
    href: "/me/briefs",
    icon: ScrollText,
    anyOf: ["me.briefs"],
  },
  {
    title: "👔 الدريس كود",
    href: "/me/dress-code",
    icon: Shirt,
    anyOf: ["me.dress_code"],
  },
  {
    title: "📈 أدائي",
    href: "/me/performance",
    icon: TrendingUp,
    anyOf: ["me.performance"],
  },
  {
    title: "🔔 التنبيهات",
    href: "/notifications",
    icon: Bell,
    anyOf: ["notifications.view"],
  },
  {
    title: "⚙️ الإعدادات",
    href: "/settings",
    icon: Settings,
    anyOf: ["settings.view"],
  },
];

export function navForRole(role: SodaRole): NavItem[] {
  const items = NAV_ITEMS.filter((item) =>
    item.anyOf.some((p) => can(role, p))
  );

  if (role === "crew_member") {
    // Crew: hide company Dashboard; keep My Dashboard.
    return items.filter((i) => i.href !== "/");
  }

  // Everyone else: hide personal "My Dashboard" alias.
  return items.filter((i) => i.href !== "/me");
}

export function homePathForRole(role: SodaRole): string {
  switch (role) {
    case "crew_member":
      return "/me";
    case "accountant":
      return "/finance";
    case "client":
      return "/notifications";
    default:
      return "/";
  }
}
