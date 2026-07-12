/**
 * Role-filtered navigation — sidebar / mobile menu.
 * Labels come from i18n (selected UI language). Icons only — no decorative emojis.
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
import type { DictKey } from "@/lib/i18n/dictionaries";

export type NavItem = {
  /** i18n key under nav.* */
  titleKey: DictKey;
  href: string;
  icon: LucideIcon;
  /** All required; item shown if role has any listed permission */
  anyOf: Permission[];
};

export const NAV_ITEMS: NavItem[] = [
  {
    titleKey: "nav.home",
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
    titleKey: "nav.mySpace",
    href: "/me",
    icon: User,
    anyOf: ["dashboard.crew"],
  },
  {
    titleKey: "nav.quotations",
    href: "/quotations",
    icon: FileText,
    anyOf: ["quotations.view"],
  },
  {
    titleKey: "nav.orders",
    href: "/orders",
    icon: ShoppingCart,
    anyOf: ["orders.view"],
  },
  {
    titleKey: "nav.projects",
    href: "/projects",
    icon: FolderKanban,
    anyOf: ["projects.view"],
  },
  {
    titleKey: "nav.commercial",
    href: "/commercial",
    icon: Briefcase,
    anyOf: ["commercial.view"],
  },
  {
    titleKey: "nav.weddings",
    href: "/orders/weddings",
    icon: Heart,
    anyOf: ["orders.view", "dashboard.company"],
  },
  {
    titleKey: "nav.clients",
    href: "/clients",
    icon: Users,
    anyOf: ["clients.view"],
  },
  {
    titleKey: "nav.crew",
    href: "/crew",
    icon: UsersRound,
    anyOf: ["crew.view", "crew.stats"],
  },
  {
    titleKey: "nav.equipment",
    href: "/equipment",
    icon: Camera,
    anyOf: ["equipment.view"],
  },
  {
    titleKey: "nav.calendar",
    href: "/calendar",
    icon: Calendar,
    anyOf: ["calendar.view"],
  },
  {
    titleKey: "nav.finance",
    href: "/finance",
    icon: DollarSign,
    anyOf: ["finance.view", "dashboard.finance"],
  },
  {
    titleKey: "nav.statistics",
    href: "/statistics",
    icon: BarChart3,
    anyOf: ["statistics.view"],
  },
  {
    titleKey: "nav.myWallet",
    href: "/me/wallet",
    icon: Wallet,
    anyOf: ["me.wallet"],
  },
  {
    titleKey: "nav.bonus",
    href: "/me/bonus",
    icon: Gift,
    anyOf: ["me.bonus"],
  },
  {
    titleKey: "nav.target",
    href: "/me/target",
    icon: Target,
    anyOf: ["me.target"],
  },
  {
    titleKey: "nav.penalties",
    href: "/me/penalties",
    icon: AlertTriangle,
    anyOf: ["me.penalties"],
  },
  {
    titleKey: "nav.myFiles",
    href: "/me/files",
    icon: FolderOpen,
    anyOf: ["me.files"],
  },
  {
    titleKey: "nav.briefs",
    href: "/me/briefs",
    icon: ScrollText,
    anyOf: ["me.briefs"],
  },
  {
    titleKey: "nav.dressCode",
    href: "/me/dress-code",
    icon: Shirt,
    anyOf: ["me.dress_code"],
  },
  {
    titleKey: "nav.myPerformance",
    href: "/me/performance",
    icon: TrendingUp,
    anyOf: ["me.performance"],
  },
  {
    titleKey: "nav.notifications",
    href: "/notifications",
    icon: Bell,
    anyOf: ["notifications.view"],
  },
  {
    titleKey: "nav.settings",
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
    return items.filter((i) => i.href !== "/");
  }

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
