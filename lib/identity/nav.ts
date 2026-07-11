/**
 * Role-filtered navigation — sidebar / mobile menu.
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
    title: "Dashboard",
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
    title: "My Dashboard",
    href: "/me",
    icon: User,
    anyOf: ["dashboard.crew"],
  },
  {
    title: "Quotations",
    href: "/quotations",
    icon: FileText,
    anyOf: ["quotations.view"],
  },
  {
    title: "Orders",
    href: "/orders",
    icon: ShoppingCart,
    anyOf: ["orders.view"],
  },
  {
    title: "Projects",
    href: "/projects",
    icon: FolderKanban,
    anyOf: ["projects.view"],
  },
  {
    title: "Commercial",
    href: "/commercial",
    icon: Briefcase,
    anyOf: ["commercial.view"],
  },
  {
    title: "Weddings",
    href: "/orders/weddings",
    icon: Heart,
    anyOf: ["orders.view", "dashboard.company"],
  },
  {
    title: "Clients",
    href: "/clients",
    icon: Users,
    anyOf: ["clients.view"],
  },
  {
    title: "The Crew",
    href: "/crew",
    icon: UsersRound,
    anyOf: ["crew.view", "crew.stats"],
  },
  {
    title: "Equipment",
    href: "/equipment",
    icon: Camera,
    anyOf: ["equipment.view"],
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: Calendar,
    anyOf: ["calendar.view"],
  },
  {
    title: "Finance",
    href: "/finance",
    icon: DollarSign,
    anyOf: ["finance.view", "dashboard.finance"],
  },
  {
    title: "Statistics",
    href: "/statistics",
    icon: BarChart3,
    anyOf: ["statistics.view"],
  },
  {
    title: "Wallet",
    href: "/me/wallet",
    icon: Wallet,
    anyOf: ["me.wallet"],
  },
  {
    title: "Bonus",
    href: "/me/bonus",
    icon: Gift,
    anyOf: ["me.bonus"],
  },
  {
    title: "Target",
    href: "/me/target",
    icon: Target,
    anyOf: ["me.target"],
  },
  {
    title: "Penalties",
    href: "/me/penalties",
    icon: AlertTriangle,
    anyOf: ["me.penalties"],
  },
  {
    title: "Files",
    href: "/me/files",
    icon: FolderOpen,
    anyOf: ["me.files"],
  },
  {
    title: "Briefs",
    href: "/me/briefs",
    icon: ScrollText,
    anyOf: ["me.briefs"],
  },
  {
    title: "Dress Code",
    href: "/me/dress-code",
    icon: Shirt,
    anyOf: ["me.dress_code"],
  },
  {
    title: "Performance",
    href: "/me/performance",
    icon: TrendingUp,
    anyOf: ["me.performance"],
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
    anyOf: ["notifications.view"],
  },
  {
    title: "Settings",
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
