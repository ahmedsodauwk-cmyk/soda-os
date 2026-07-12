"use client";

import { Menu, Settings } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { HeaderSearch } from "@/components/layout/header-search";
import { HeaderNotifications } from "@/components/layout/header-notifications";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  SidebarContent,
  type SidebarUser,
} from "@/components/layout/sidebar";
import { HumanTitle } from "@/components/brand/human-title";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { getSideLanguage } from "@/lib/brand/human-layer";
import type { HumanLayerKey } from "@/lib/brand/human-layer";
import { useI18n } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dictionaries";
import type { NotificationRecord } from "@/lib/core/types";

interface HeaderProps {
  /** i18n key for the page title (UI language). */
  titleKey?: DictKey;
  /** Fallback English title when titleKey is omitted. */
  title?: string;
  /** Side Language override (always Egyptian Arabic). */
  subtitle?: string;
  /** Side Language key — preferred over subtitle. */
  layer?: HumanLayerKey;
  notifications?: NotificationRecord[];
  user?: SidebarUser;
}

export default function Header({
  titleKey,
  title,
  subtitle,
  layer = "dashboard",
  notifications = [],
  user,
}: HeaderProps) {
  const { t } = useI18n();
  const displayTitle = titleKey
    ? t(titleKey)
    : (title ?? t("pages.home"));
  const sideLanguage =
    subtitle ?? (layer ? getSideLanguage(layer) : getSideLanguage("dashboard"));

  return (
    <header className="sticky top-0 z-10 flex min-h-[4.25rem] items-center justify-between gap-4 border-b border-border/80 bg-background/85 px-4 py-3.5 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon-sm" className="lg:hidden" />
            }
          >
            <Menu />
            <span className="sr-only">{t("actions.openMenu")}</span>
          </SheetTrigger>

          <SheetContent side="left" className="w-60 gap-0 p-0" showCloseButton>
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
              <SidebarContent user={user} />
            </div>
          </SheetContent>
        </Sheet>

        <HumanTitle
          title={displayTitle}
          explanation={sideLanguage}
          as="h1"
          size="page"
        />
      </div>

      <div className="flex items-center gap-2">
        <LanguageSwitcher variant="icon" />
        <HeaderSearch />
        <HeaderNotifications initial={notifications} />

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                nativeButton={false}
                render={<Link href="/settings" />}
              />
            }
          >
            <Settings />
            <span className="sr-only">{t("common.settings")}</span>
          </TooltipTrigger>
          <TooltipContent>{t("common.settings")}</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
