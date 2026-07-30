"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  LogOut,
  Info,
  Settings,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { SodaLogo } from "@/components/brand/soda-logo";
import { signOutAction } from "@/lib/auth/actions";
import { navSectionsForSidebarDisplay } from "@/lib/identity/nav";
import {
  ACCESS_LEVEL_LABELS,
  type AccessLevel,
} from "@/lib/identity/access-levels";
import { ROLE_LABELS, type SodaRole } from "@/lib/identity/roles";
import { operationalT } from "@/lib/i18n/operational";
import type { NavItem, NavSection } from "@/lib/identity/nav";

const SIDEBAR_COLLAPSED_KEY = "soda-sidebar-collapsed";
const MY_WORKSPACE_OPEN_KEY = "soda-my-workspace-open";

function readStoredFlag(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export type SidebarUser = {
  /** Auth user id — notification lifecycle localStorage key. */
  userId?: string;
  fullName: string;
  role: SodaRole;
  accessLevel?: AccessLevel;
  avatarInitials: string;
  avatarUrl?: string | null;
  email: string;
  /** Linked people.profiles person id — My Profile → /people/[id]. */
  personId?: string | null;
  /** DB-backed permission ids — when set, nav filters by Access Level grants. */
  allowedPermissions?: readonly string[];
};

interface SidebarContentProps {
  user?: SidebarUser;
  /** Icon-only rail — desktop collapse. */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

function isNavActive(pathname: string, href: string): boolean {
  if (href === "#") return false;
  if (href === "/") return pathname === "/";
  if (href === "/me") return pathname === "/me";
  return (
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (href === "/commercial" && pathname.startsWith("/workspaces")) ||
    (href === "/people" && pathname.startsWith("/crew"))
  );
}

function profileHref(user?: SidebarUser): string {
  if (user?.personId) return `/people/${user.personId}`;
  return "/me";
}

function SidebarNavGroup({
  items,
  pathname,
  collapsed,
  t,
}: {
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
  t: (key: NavItem["titleKey"]) => string;
}) {
  const groupRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ top: 0, height: 36, visible: false });

  useEffect(() => {
    if (collapsed || !groupRef.current) {
      setIndicator((s) => ({ ...s, visible: false }));
      return;
    }
    const activeEl = groupRef.current.querySelector<HTMLElement>(
      '[aria-current="page"]'
    );
    if (!activeEl) {
      setIndicator((s) => ({ ...s, visible: false }));
      return;
    }
    const groupRect = groupRef.current.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    setIndicator({
      top: activeRect.top - groupRect.top,
      height: activeRect.height,
      visible: true,
    });
  }, [pathname, collapsed, items]);

  return (
    <div ref={groupRef} className="soda-sidebar-nav-group relative space-y-0.5">
      {indicator.visible ? (
        <div
          className="soda-sidebar-indicator"
          style={{ top: indicator.top, height: indicator.height }}
          aria-hidden
        />
      ) : null}
      {items.map((item, index) => {
        const isBrain = item.accent === "brain";
        const prevIsBrain =
          index > 0 && items[index - 1]?.accent === "brain";
        const showBrainSep = isBrain && index > 0 && !prevIsBrain;
        return (
          <div key={item.titleKey}>
            {showBrainSep ? (
              <div
                className="my-2 border-t border-violet-500/25"
                aria-hidden
              />
            ) : null}
            <NavLinkButton
              item={item}
              active={isNavActive(pathname, item.href)}
              collapsed={collapsed}
              title={t(item.titleKey)}
            />
          </div>
        );
      })}
    </div>
  );
}

function NavLinkButton({
  item,
  active,
  collapsed,
  title,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  title: string;
}) {
  const Icon = item.icon;

  const button = (
    <Button
      variant="ghost"
      nativeButton={false}
      render={
        <Link
          href={item.href}
          prefetch
          aria-current={active ? "page" : undefined}
          aria-label={collapsed ? title : undefined}
        />
      }
      className={cn(
        "relative h-9 w-full cursor-pointer justify-start gap-2 rounded-lg font-normal transition-all duration-200",
        collapsed ? "justify-center px-2" : "px-3",
        item.accent === "brain"
          ? active
            ? "soda-nav-brain soda-nav-pill-active bg-violet-500/25 text-violet-100 shadow-[0_0_12px_rgba(139,92,246,0.35)]"
            : "soda-nav-brain text-violet-200/90 hover:bg-violet-500/15 hover:text-violet-100 hover:shadow-[0_0_10px_rgba(139,92,246,0.2)]"
          : active
            ? "soda-nav-pill-active soda-selected text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
      )}
    >
      {item.emoji ? (
        <span className="text-sm leading-none" aria-hidden>
          {item.emoji}
        </span>
      ) : (
        <Icon
          className={cn("size-4 shrink-0", active ? "text-soda-pink" : "opacity-85")}
        />
      )}
      {!collapsed ? <span className="truncate">{title}</span> : null}
    </Button>
  );

  if (!collapsed) return button;

  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent side="left">{title}</TooltipContent>
    </Tooltip>
  );
}

function MyWorkspaceSection({
  section,
  pathname,
  collapsed,
  t,
}: {
  section: NavSection;
  pathname: string;
  collapsed: boolean;
  t: (key: NavItem["titleKey"]) => string;
}) {
  const [open, setOpen] = useState(() => readStoredFlag(MY_WORKSPACE_OPEN_KEY));

  function handleOpenChange(next: boolean) {
    setOpen(next);
    try {
      localStorage.setItem(MY_WORKSPACE_OPEN_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  if (collapsed) {
    return (
      <div className="space-y-0.5 border-t border-sidebar-border/60 pt-2">
        {section.items.map((item) => {
          const title = t(item.titleKey);
          const active = isNavActive(pathname, item.href);
          return (
            <NavLinkButton
              key={item.titleKey}
              item={item}
              active={active}
              collapsed
              title={title}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => handleOpenChange(!open)}
        className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-[11px] font-semibold tracking-[0.06em] text-sidebar-foreground/70 uppercase transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        aria-expanded={open}
      >
        <span aria-hidden>{section.emoji}</span>
        <span className="flex-1">{t(section.labelKey)}</span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open ? (
        <div
          className="soda-my-workspace-collapse mt-0.5"
          data-open="true"
        >
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const title = t(item.titleKey);
              const active = isNavActive(pathname, item.href);
              return (
                <NavLinkButton
                  key={item.titleKey}
                  item={item}
                  active={active}
                  collapsed={false}
                  title={title}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <div className="soda-my-workspace-collapse" data-open="false">
          <div />
        </div>
      )}
    </div>
  );
}

export function SidebarContent({
  user,
  collapsed = false,
  onToggleCollapse,
}: SidebarContentProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const logoPlacement = isHome ? "home" : "sidebar";
  const t = operationalT;
  const [pending, startTransition] = useTransition();

  const sections =
    user?.allowedPermissions && user.allowedPermissions.length > 0
      ? navSectionsForSidebarDisplay(user.accessLevel, user.allowedPermissions)
      : [];

  const companySection = sections.find((s) => s.id === "company");
  const meSection = sections.find((s) => s.id === "me");

  const accessLabel = user?.accessLevel
    ? (ACCESS_LEVEL_LABELS[user.accessLevel] ?? null)
    : user?.role
      ? (ROLE_LABELS[user.role] ?? null)
      : null;

  function handleLogout() {
    startTransition(() => {
      void signOutAction();
    });
  }

  return (
    <>
      <div
        className={cn(
          "relative flex h-14 shrink-0 items-center border-b border-sidebar-border/80",
          collapsed ? "justify-center px-2" : "px-3.5"
        )}
      >
        {collapsed ? (
          <SodaLogo placement={logoPlacement} interactive showWord={false} />
        ) : (
          <SodaLogo placement={logoPlacement} interactive />
        )}
        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              "absolute top-1/2 hidden -translate-y-1/2 cursor-pointer rounded-md p-1 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground lg:inline-flex",
              collapsed ? "inset-inline-end-1" : "inset-inline-end-2"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </button>
        ) : null}
      </div>

      <nav
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3 [-webkit-overflow-scrolling:touch]"
        aria-label="Primary"
      >
        {companySection ? (
          <SidebarNavGroup
            items={companySection.items}
            pathname={pathname}
            collapsed={collapsed}
            t={t}
          />
        ) : null}

        {meSection ? (
          <div className="mt-4">
            <MyWorkspaceSection
              section={meSection}
              pathname={pathname}
              collapsed={collapsed}
              t={t}
            />
          </div>
        ) : null}
      </nav>

      <div
        className={cn(
          "shrink-0 border-t border-sidebar-border/80 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]",
          collapsed ? "px-2" : "px-3"
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "soda-sidebar-profile flex w-full cursor-pointer items-center gap-2.5 rounded-lg border border-sidebar-border/40 bg-sidebar-accent/15 p-2 text-left outline-none transition-colors hover:bg-sidebar-accent/30 focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              collapsed && "justify-center border-transparent bg-transparent"
            )}
            aria-label={collapsed ? user?.fullName ?? "Account" : undefined}
          >
            <Avatar size="sm">
              {user?.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt={user.fullName} />
              ) : null}
              <AvatarFallback className="bg-[linear-gradient(135deg,#29194A,#D23B68)] text-xs font-medium text-white">
                {user?.avatarInitials ?? "SO"}
              </AvatarFallback>
            </Avatar>

            {!collapsed ? (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {user?.fullName ?? "SODA"}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/60">
                  {accessLabel ?? "—"}
                </p>
                {user?.accessLevel ? (
                  <p className="truncate text-[10px] text-sidebar-foreground/45">
                    Access Level: {accessLabel ?? user.accessLevel}
                  </p>
                ) : null}
              </div>
            ) : null}
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>
              {user?.fullName ?? t("common.myAccount")}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="cursor-pointer"
                nativeButton={false}
                render={<Link href={profileHref(user)} />}
              >
                <UserRound />
                {t("common.myProfile")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                nativeButton={false}
                render={<Link href="/settings" />}
              >
                <Settings />
                {t("common.myAccount")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                nativeButton={false}
                render={<Link href="/settings/password" />}
              >
                <KeyRound />
                {t("common.changePassword")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <LanguageSwitcher variant="inline" />
            </div>
            <DropdownMenuItem
              className="cursor-pointer"
              nativeButton={false}
              render={<Link href="/about" />}
            >
              <Info />
              {t("common.aboutSoda")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer"
              disabled={pending}
              onClick={handleLogout}
            >
              <LogOut />
              {t("actions.logOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}

interface SidebarProps {
  user?: SidebarUser;
}

export default function Sidebar({ user }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(() =>
    readStoredFlag(SIDEBAR_COLLAPSED_KEY)
  );

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "soda-sidebar-rail hidden h-screen min-h-0 shrink-0 flex-col border-r border-sidebar-border text-sidebar-foreground transition-[width] duration-200 lg:flex",
        collapsed ? "w-[4.25rem]" : "w-56"
      )}
    >
      <SidebarContent
        user={user}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      />
    </aside>
  );
}
