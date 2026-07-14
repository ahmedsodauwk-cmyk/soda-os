/**
 * Role-filtered navigation — sidebar / mobile menu.
 * Filters by permission keys (DB SoT via permission set, or sync can() fallback).
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
  Brain,
} from "lucide-react";

import type { AccessLevel } from "@/lib/identity/access-levels";
import { isNavHrefAllowed } from "@/lib/identity/module-access";
import {
  can,
  setHasAny,
  type Permission,
} from "@/lib/identity/permissions";
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
  /** Optional emoji prefix (e.g. SODA Brain 🧠) */
  emoji?: string;
  /** Distinct chrome — e.g. Founder Brain layer above Home */
  accent?: "brain";
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
    titleKey: "nav.brain",
    href: "/brain",
    icon: Brain,
    anyOf: ["brain.view"],
    workspace: "company",
    emoji: "🧠",
    accent: "brain",
  },
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
    titleKey: "nav.myOrders",
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
    anyOf: ["statistics.view", "reports.view"],
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

function prefersPersonalHome(granted: ReadonlySet<string>): boolean {
  const hasCompanyDash =
    granted.has("dashboard.company") ||
    granted.has("dashboard.team") ||
    granted.has("dashboard.finance");
  const hasCrewOnly =
    granted.has("dashboard.crew") ||
    granted.has("me.wallet") ||
    granted.has("me.performance");
  return hasCrewOnly && !hasCompanyDash;
}

/**
 * Filter nav by an explicit permission set (from DB via permissionsForAsync).
 * Prefer this over role switches when permission keys exist.
 */
export function navForPermissions(
  granted: ReadonlySet<string> | readonly string[]
): NavItem[] {
  const set =
    granted instanceof Set ? granted : new Set(granted as readonly string[]);
  // Drop My Orders duplicate unless Access Level overlay selects it.
  let items = NAV_ITEMS.filter(
    (item) => item.titleKey !== "nav.myOrders" && setHasAny(set, item.anyOf)
  );

  if (prefersPersonalHome(set)) {
    items = items.filter((i) => i.href !== "/");
  }

  return items;
}

/**
 * Permission filter + Access Level module matrix (Mission 04.5.0).
 * Does not change Access Level permission templates — only consumes level.
 */
export function navForAccessLevel(
  level: AccessLevel,
  granted: ReadonlySet<string> | readonly string[]
): NavItem[] {
  const set =
    granted instanceof Set ? granted : new Set(granted as readonly string[]);

  let items = NAV_ITEMS.filter((item) => {
    // SODA Brain — Founder only (permission seed optional until migration applied)
    if (item.accent === "brain" || item.href === "/brain") {
      return level === "founder";
    }
    if (level === "team") {
      if (item.titleKey === "nav.orders") return false;
      if (item.titleKey === "nav.myOrders") {
        return setHasAny(set, item.anyOf) && isNavHrefAllowed(level, item.href);
      }
    } else if (item.titleKey === "nav.myOrders") {
      return false;
    }
    if (!setHasAny(set, item.anyOf)) return false;
    return isNavHrefAllowed(level, item.href);
  });

  // Access Level matrix: Home stays visible for Team / AM / TL.
  if (level !== "founder" && prefersPersonalHome(set) && level === "team") {
    // Keep Home for Team (matrix). Other personal-only legacy paths may still drop it.
  } else if (prefersPersonalHome(set) && level !== "team") {
    items = items.filter((i) => i.href !== "/");
  }

  // Dedupe by href (first wins — My Orders already replaced Orders for Team).
  const seen = new Set<string>();
  items = items.filter((i) => {
    if (seen.has(i.href)) return false;
    seen.add(i.href);
    return true;
  });

  return items;
}

/** @deprecated Prefer navForPermissions with DB permission set. */
export function navForRole(role: SodaRole): NavItem[] {
  const items = NAV_ITEMS.filter((item) =>
    item.anyOf.some((p) => can(role, p))
  );

  if (
    role === "crew_member" ||
    role === "photographer" ||
    role === "videographer" ||
    role === "photo_editor" ||
    role === "video_editor" ||
    role === "freelancer" ||
    role === "social_media_manager"
  ) {
    return items.filter((i) => i.href !== "/");
  }

  return items;
}

export function navSectionsFromItems(items: NavItem[]): NavSection[] {
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

export function navSectionsForPermissions(
  granted: ReadonlySet<string> | readonly string[]
): NavSection[] {
  return navSectionsFromItems(navForPermissions(granted));
}

export function navSectionsForAccessLevel(
  level: AccessLevel,
  granted: ReadonlySet<string> | readonly string[]
): NavSection[] {
  return navSectionsFromItems(navForAccessLevel(level, granted));
}

/** @deprecated Prefer navSectionsForPermissions. */
export function navSectionsForRole(role: SodaRole): NavSection[] {
  return navSectionsFromItems(navForRole(role));
}

/**
 * Home path from permission set — adapts OS entry by authority.
 * Not hardcoded role switches when permission keys exist.
 */
export function homePathForPermissions(
  granted: ReadonlySet<string> | readonly string[]
): string {
  const set =
    granted instanceof Set ? granted : new Set(granted as readonly string[]);

  if (set.has("dashboard.finance") && !set.has("dashboard.company") && !set.has("dashboard.team")) {
    return "/finance";
  }
  if (set.has("finance.view") && !set.has("dashboard.company") && !set.has("orders.edit")) {
    return "/finance";
  }
  if (
    (set.has("clients.view") || set.has("clients.edit")) &&
    !set.has("dashboard.company") &&
    !set.has("dashboard.team") &&
    !set.has("dashboard.crew")
  ) {
    return "/clients";
  }
  if (set.has("social.view") && !set.has("dashboard.company") && !set.has("dashboard.team")) {
    return "/calendar";
  }
  if (prefersPersonalHome(set)) {
    return "/me";
  }
  if (
    set.has("notifications.view") &&
    !set.has("dashboard.company") &&
    !set.has("dashboard.team") &&
    !set.has("dashboard.crew") &&
    !set.has("dashboard.finance") &&
    !set.has("orders.view")
  ) {
    return "/notifications";
  }
  if (set.has("dashboard.company") || set.has("dashboard.team") || set.has("dashboard.finance")) {
    return "/";
  }
  return "/me";
}

/** Home path from Access Level matrix — Team/AM/TL land on Home. */
export function homePathForAccessLevel(
  level: AccessLevel,
  granted: ReadonlySet<string> | readonly string[]
): string {
  if (
    level === "founder" ||
    level === "account_manager" ||
    level === "team_leader" ||
    level === "team"
  ) {
    return "/";
  }
  return homePathForPermissions(granted);
}

/** @deprecated Prefer homePathForPermissions. */
export function homePathForRole(role: SodaRole): string {
  switch (role) {
    case "crew_member":
    case "photographer":
    case "videographer":
    case "photo_editor":
    case "video_editor":
    case "freelancer":
      return "/me";
    case "social_media_manager":
      return "/calendar";
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

/** Serializable nav item for client (icon resolved by href). */
export type NavHrefVisibility = {
  href: string;
  workspace: "company" | "me";
};
