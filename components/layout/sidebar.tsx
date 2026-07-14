"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import {
  KeyRound,
  LogOut,
  Info,
  Settings,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { SodaLogo } from "@/components/brand/soda-logo";
import { signOutAction } from "@/lib/auth/actions";
import {
  navSectionsForPermissions,
  navSectionsForRole,
} from "@/lib/identity/nav";
import { ROLE_LABELS, type SodaRole } from "@/lib/identity/roles";
import { useI18n } from "@/lib/i18n/provider";

export type SidebarUser = {
  fullName: string;
  role: SodaRole;
  avatarInitials: string;
  email: string;
  /** Linked people.profiles person id — My Profile → /people/[id]. */
  personId?: string | null;
  /** DB-backed permission ids — when set, nav filters by authority not role map. */
  allowedPermissions?: readonly string[];
};

interface SidebarContentProps {
  user?: SidebarUser;
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

export function SidebarContent({ user }: SidebarContentProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const role = user?.role ?? "owner";
  const sections =
    user?.allowedPermissions && user.allowedPermissions.length > 0
      ? navSectionsForPermissions(user.allowedPermissions)
      : navSectionsForRole(role);

  function handleLogout() {
    startTransition(() => {
      void signOutAction();
    });
  }

  return (
    <>
      <div className="relative flex items-center gap-2.5 border-b border-sidebar-border px-4 py-5">
        <SodaLogo placement="sidebar" />
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-5">
          {sections.map((section) => (
            <div key={section.id} className="space-y-1">
              <p className="flex items-center gap-1.5 px-3 pb-1 text-[10px] font-semibold tracking-[0.08em] text-sidebar-foreground/55 uppercase">
                <span aria-hidden>{section.emoji}</span>
                <span>{t(section.labelKey)}</span>
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const title = t(item.titleKey);
                  const active = isNavActive(pathname, item.href);

                  return (
                    <Button
                      key={item.titleKey}
                      variant="ghost"
                      nativeButton={false}
                      render={
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                        />
                      }
                      className={cn(
                        "h-9 w-full cursor-pointer justify-start gap-2.5 rounded-md px-3 font-normal transition-all",
                        active
                          ? "soda-nav-active soda-selected border-l-[3px] border-soda-pink bg-sidebar-accent text-sidebar-accent-foreground shadow-[0_0_20px_color-mix(in_srgb,var(--soda-pink)_35%,transparent)]"
                          : "border-l-[3px] border-transparent text-sidebar-foreground/70 hover:border-soda-pink/50 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4",
                          active ? "text-soda-pink" : "opacity-85"
                        )}
                      />
                      <span>{title}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="space-y-4 border-t border-sidebar-border p-4">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg p-2 text-left outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <Avatar size="sm">
              <AvatarFallback className="bg-[linear-gradient(135deg,#29194A,#D23B68)] text-xs font-medium text-white">
                {user?.avatarInitials ?? "SO"}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user?.fullName ?? "SODA"}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/60">
                {ROLE_LABELS[role]}
                {user?.email ? ` · ${user.email}` : null}
              </p>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>{user?.fullName ?? t("common.myAccount")}</DropdownMenuLabel>
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
  return (
    <aside className="soda-sidebar-rail hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border text-sidebar-foreground lg:flex">
      <SidebarContent user={user} />
    </aside>
  );
}
