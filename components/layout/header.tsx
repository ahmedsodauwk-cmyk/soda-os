"use client";

import { Bell, Menu, Search, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  getModuleSlogan,
  NOTIFICATION_COPY,
} from "@/lib/brand/soda-voice";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({
  title = "Dashboard",
  subtitle = getModuleSlogan("dashboard"),
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-3">
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

        <div>
          <h1 className="text-base font-semibold tracking-tight">{title}</h1>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden sm:block">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." className="h-8 w-48 pl-8 lg:w-64" />
        </div>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger
              render={
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon-sm" className="relative" />
                  }
                />
              }
            >
              <Bell />
              <Badge className="absolute -top-0.5 -right-0.5 size-4 justify-center rounded-full p-0 text-[10px]">
                {NOTIFICATION_COPY.length}
              </Badge>
              <span className="sr-only">Notifications</span>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>

          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {NOTIFICATION_COPY.map((item) => (
              <DropdownMenuItem key={item} className="whitespace-normal">
                {item}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

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
