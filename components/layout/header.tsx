"use client";

import { Menu, Settings } from "lucide-react";

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
import { SidebarContent } from "@/components/layout/sidebar";
import { HumanTitle } from "@/components/brand/human-title";
import { getModuleSlogan } from "@/lib/brand/soda-voice";
import type { NotificationRecord } from "@/lib/core/types";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  notifications?: NotificationRecord[];
}

export default function Header({
  title = "Dashboard",
  subtitle = getModuleSlogan("dashboard"),
  notifications = [],
}: HeaderProps) {
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
            <span className="sr-only">Open menu</span>
          </SheetTrigger>

          <SheetContent side="left" className="w-60 gap-0 p-0" showCloseButton>
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>

        <HumanTitle
          title={title}
          explanation={subtitle}
          as="h1"
          size="page"
        />
      </div>

      <div className="flex items-center gap-2">
        <HeaderSearch />
        <HeaderNotifications initial={notifications} />

        <Tooltip>
          <TooltipTrigger
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <Settings />
            <span className="sr-only">Settings</span>
          </TooltipTrigger>
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
