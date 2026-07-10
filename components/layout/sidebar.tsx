"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Briefcase,
  Heart,
  Users,
  Calendar,
  DollarSign,
  Settings,
  LogOut,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SodaLogo } from "@/components/brand/soda-logo";

const menu = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/" },
  { title: "Orders", icon: ShoppingCart, href: "/orders" },
  { title: "Workspaces", icon: Briefcase, href: "/workspaces" },
  { title: "Weddings", icon: Heart, href: "#" },
  { title: "Clients", icon: Users, href: "/clients" },
  { title: "Calendar", icon: Calendar, href: "#" },
  { title: "Finance", icon: DollarSign, href: "#" },
  { title: "Settings", icon: Settings, href: "#" },
];

export function SidebarContent() {
  const pathname = usePathname();

  return (
    <>
      <div className="flex items-center gap-2.5 border-b border-sidebar-border px-4 py-4">
        <SodaLogo placement="sidebar" />
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-0.5">
          {menu.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href !== "#" &&
              (item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href));

            return (
              <Button
                key={item.title}
                variant="ghost"
                nativeButton={false}
                render={
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                  />
                }
                className={cn(
                  "h-9 w-full justify-start gap-2.5 rounded-md px-3 font-normal",
                  isActive
                    ? "border-l-2 border-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground"
                    : "border-l-2 border-transparent text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "size-4",
                    isActive && "text-sidebar-primary"
                  )}
                />
                <span>{item.title}</span>
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="space-y-4 border-t border-sidebar-border p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Storage</p>
            <p className="text-xs text-muted-foreground">75%</p>
          </div>
          <Progress value={75} className="gap-0" />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <Avatar size="sm">
              <AvatarFallback className="bg-primary text-xs font-medium text-primary-foreground">
                JS
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">Junior Soda</p>
              <p className="truncate text-xs text-muted-foreground">
                Administrator
              </p>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}

export default function Sidebar() {
  return (
    <aside className="hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <SidebarContent />
    </aside>
  );
}
