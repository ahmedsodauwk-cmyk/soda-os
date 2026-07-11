"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  LogOut,
  User,
  Info,
  FileText,
  FolderKanban,
  Camera,
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
import { SODA_OPERATOR, SODA_OPERATOR_EN } from "@/lib/brand/soda-voice";

const menu = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/" },
  { title: "Quotations", icon: FileText, href: "/quotations" },
  { title: "Orders", icon: ShoppingCart, href: "/orders" },
  { title: "Projects", icon: FolderKanban, href: "/projects" },
  { title: "Commercial", icon: Briefcase, href: "/commercial" },
  { title: "Weddings", icon: Heart, href: "/orders/weddings" },
  { title: "Clients", icon: Users, href: "/clients" },
  { title: "The Crew", icon: UsersRound, href: "/crew" },
  { title: "Equipment", icon: Camera, href: "/equipment" },
  { title: "Calendar", icon: Calendar, href: "/calendar" },
  { title: "Finance", icon: DollarSign, href: "/finance" },
  { title: "Settings", icon: Settings, href: "#" },
];

export function SidebarContent() {
  const pathname = usePathname();

  return (
    <>
      <div className="relative flex items-center gap-2.5 border-b border-sidebar-border px-4 py-5">
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
                : pathname.startsWith(item.href) ||
                  (item.href === "/commercial" &&
                    pathname.startsWith("/workspaces")) ||
                  (item.href === "/crew" && pathname.startsWith("/people")));

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
                  "h-9 w-full justify-start gap-2.5 rounded-md px-3 font-normal transition-all",
                  isActive
                    ? "border-l-[3px] border-soda-pink bg-sidebar-accent text-sidebar-accent-foreground"
                    : "border-l-[3px] border-transparent text-muted-foreground hover:border-soda-pink/30 hover:bg-sidebar-accent/60 hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "size-4",
                    isActive ? "text-soda-pink" : "opacity-80"
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
            <p className="font-mono text-xs text-soda-pink">75%</p>
          </div>
          <Progress value={75} className="gap-0" />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <Avatar size="sm">
              <AvatarFallback className="bg-[#2D1B4E] text-xs font-medium text-white">
                JS
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="font-ar truncate text-sm font-medium" dir="rtl">
                {SODA_OPERATOR}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Administrator · {SODA_OPERATOR_EN}
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
            <DropdownMenuItem render={<Link href="/about" />}>
              <Info />
              About SODA
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/login" />}>
              <LogOut />
              Login shell
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
    <aside className="soda-sidebar-rail hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border text-sidebar-foreground lg:flex">
      <SidebarContent />
    </aside>
  );
}
