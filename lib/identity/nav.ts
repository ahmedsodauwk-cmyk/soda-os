/**
 * Role-filtered navigation — sidebar / mobile menu.
 * Two workspaces: Company + My. Labels from i18n. Lucide icons only.
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
  Building2,
  UserRound,
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
  workspace: "company" | "me";
};

export type NavSection = {
  id: "company" | "me";
  /** i18n key for section header */
  labelKey: DictKey;
  /** Optional emoji marker for section header only */
  emoji: string;
  icon: LucideIcon;
  items: NavItem[];
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
    workspace: "company",
  },
  {
    titleKey: "nav.quotations",
    href: "/quotations",
    icon: FileText,
    anyOf: ["quotations.view"],
    workspace: "company",
  },
  {
    titleKey: "nav.orders",
    href: "/orders",
    icon: ShoppingCart,
    anyOf: ["orders.view"],
    workspace: "company",
  },
  {
    titleKey: "nav.projects",
    href: "/projects",
    icon: FolderKanban,
    anyOf: ["projects.view"],
    workspace: "company",
  },
  {
    titleKey: "nav.commercial",
    href: "/commercial",
    icon: Briefcase,
    anyOf: ["commercial.view"],
    workspace: "company",
  },
  {
    titleKey: "nav.weddings",
    href: "/orders/weddings",
    icon: Heart,
    anyOf: ["orders.view", "dashboard.company"],
    workspace: "company",
  },
  {
    titleKey: "nav.clients",
    href: "/clients",
    icon: Users,
    anyOf: ["clients.view"],
    workspace: "company",
  },
  {
    titleKey: "nav.people",
    href: "/people",
    icon: UsersRound,
    anyOf: ["people.view", "crew.view", "crew.stats"],
    workspace: "company",
  },
  {
    titleKey: "nav.equipment",
    href: "/equipment",
    icon: Camera,
    anyOf: ["equipment.view"],
    workspace: "company",
  },
  {
    titleKey: "nav.calendar",
    href: "/calendar",
    icon: Calendar,
    anyOf: ["calendar.view"],
    workspace: "company",
  },
  {
    titleKey: "nav.finance",
    href: "/finance",
    icon: DollarSign,
    anyOf: ["finance.view", "dashboard.finance"],
    workspace: "company",
  },
  {
    titleKey: "nav.statistics",
    href: "/statistics",
    icon: BarChart3,
    anyOf: ["statistics.view"],
    workspace: "company",
  },
  {
    titleKey: "nav.myWallet",
    href: "/me/wallet",
    icon: Wallet,
    anyOf: ["me.wallet"],
    workspace: "me",
  },
  {
    titleKey: "nav.bonus",
    href: "/me/bonus",
    icon: Gift,
    anyOf: ["me.bonus"],
    workspace: "me",
  },
  {
    titleKey: "nav.target",
    href: "/me/target",
    icon: Target,
    anyOf: ["me.target"],
    workspace: "me",
  },
  {
    titleKey: "nav.penalties",
    href: "/me/penalties",
    icon: AlertTriangle,
    anyOf: ["me.penalties"],
    workspace: "me",
  },
  {
    titleKey: "nav.myFiles",
    href: "/me/files",
    icon: FolderOpen,
    anyOf: ["me.files"],
    workspace: "me",
  },
  {
    titleKey: "nav.briefs",
    href: "/me/briefs",
    icon: ScrollText,
    anyOf: ["me.briefs"],
    workspace: "me",
  },
  {
    titleKey: "nav.dressCode",
    href: "/me/dress-code",
    icon: Shirt,
    anyOf: ["me.dress_code"],
    workspace: "me",
  },
  {
    titleKey: "nav.myPerformance",
    href: "/me/performance",
    icon: TrendingUp,
    anyOf: ["me.performance"],
    workspace: "me",
  },
  {
    titleKey: "nav.notifications",
    href: "/notifications",
    icon: Bell,
    anyOf: ["notifications.view"],
    workspace: "me",
  },
  {
    titleKey: "nav.settings",
    href: "/settings",
    icon: Settings,
    anyOf: ["settings.view"],
    workspace: "me",
  },
];

export function navForRole(role: SodaRole): NavItem[] {
  const items = NAV_ITEMS.filter((item) =>
    item.anyOf.some((p) => can(role, p))
  );

  if (role === "crew_member" || role === "photographer" || role === "videographer" || role === "photo_editor" || role === "video_editor" || role === "freelancer") {
    return items.filter((i) => i.href !== "/");
  }

  return items;
}

export function navSectionsForRole(role: SodaRole): NavSection[] {
  const items = navForRole(role);
  const company = items.filter((i) => i.workspace === "company");
  const me = items.filter((i) => i.workspace === "me");

  const sections: NavSection[] = [];
  if (company.length > 0) {
    sections.push({
      id: "company",
      labelKey: "nav.companyWorkspace",
      emoji: "🏢",
      icon: Building2,
      items: company,
    });
  }
  if (me.length > 0) {
    sections.push({
      id: "me",
      labelKey: "nav.myWorkspace",
      emoji: "👤",
      icon: UserRound,
      items: me,
    });
  }
  return sections;
}

export function homePathForRole(role: SodaRole): string {
  switch (role) {
    case "crew_member":
    case "photographer":
    case "videographer":
    case "photo_editor":
    case "video_editor":
    case "freelancer":
      return "/me";
    case "accountant":
      return "/finance";
    case "client":
    case "guest":
      return "/notifications";
    case "sales":
    case "customer_service":
      return "/clients";
    default:
      return "/";
  }
}
