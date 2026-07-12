"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { NotificationRecord } from "@/lib/core/types";

interface HeaderNotificationsProps {
  initial: NotificationRecord[];
}

function safeHref(item: NotificationRecord): string {
  if (item.href && item.href.startsWith("/")) return item.href;
  switch (item.entityType) {
    case "order":
      return `/orders/${item.entityId}`;
    case "client":
      return `/clients/${item.entityId}`;
    case "project":
      return `/projects/${item.entityId}`;
    case "person":
      return `/crew/${item.entityId}`;
    case "payment":
    case "invoice":
      return "/finance";
    case "quotation":
      return `/quotations/${item.entityId}`;
    default:
      return "/notifications";
  }
}

function friendlyTitle(item: NotificationRecord): string {
  const t = item.title?.trim();
  if (t && !/^[A-Z][a-zA-Z]+(?:[A-Z][a-zA-Z]+)+$/.test(t)) return t;
  // PascalCase event-type fallback → spaced words
  if (t) return t.replace(/([a-z])([A-Z])/g, "$1 $2");
  return "Activity update";
}

export function HeaderNotifications({ initial }: HeaderNotificationsProps) {
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());

  const items = initial.map((n) =>
    readIds.has(n.id) ? { ...n, read: true } : n
  );
  const unread = items.filter((n) => !n.read).length;

  function markRead(id: string) {
    setReadIds((prev) => new Set(prev).add(id));
  }

  return (
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
          {unread > 0 ? (
            <Badge className="absolute -top-0.5 -right-0.5 size-4 justify-center rounded-full border-0 bg-soda-pink p-0 text-[10px] text-soda-action-foreground">
              {Math.min(unread, 9)}
            </Badge>
          ) : null}
          <span className="sr-only">Notifications</span>
        </TooltipTrigger>
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span>Notifications</span>
          <Link
            href="/notifications"
            className="text-xs font-normal text-soda-pink hover:underline"
          >
            Open all
          </Link>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <DropdownMenuItem disabled className="text-muted-foreground">
            No recent activity
          </DropdownMenuItem>
        ) : (
          items.slice(0, 8).map((item) => {
            const href = safeHref(item);
            return (
              <DropdownMenuItem
                key={item.id}
                className="items-start whitespace-normal p-0"
                onClick={() => markRead(item.id)}
              >
                <Link href={href} className="min-w-0 space-y-0.5 px-2 py-1.5">
                  <p className="text-sm font-medium">{friendlyTitle(item)}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {item.body || "Open related record"}
                  </p>
                </Link>
              </DropdownMenuItem>
            );
          })
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="p-0" onClick={() => undefined}>
          <Link
            href="/notifications"
            className="flex w-full items-center justify-center px-2 py-2 text-sm font-medium text-soda-pink"
          >
            Notification center
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
