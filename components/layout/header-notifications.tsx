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
import { notificationActionLabel } from "@/lib/core/notifications/engine";
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

function isDevEventName(title: string): boolean {
  return /^[A-Z][a-zA-Z]+(?:[A-Z][a-zA-Z]+)+$/.test(title.trim());
}

function friendlyTitle(item: NotificationRecord): string {
  const t = item.title?.trim();
  if (t && !isDevEventName(t)) return t;
  return "تحديث من الستوديو";
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

  // No Tooltip wrapping DropdownMenuTrigger — nesting causes Base UI Error #31.
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative cursor-pointer"
            aria-label="التنبيهات"
          />
        }
      >
        <Bell />
        {unread > 0 ? (
          <Badge className="absolute -top-0.5 -right-0.5 size-4 justify-center rounded-full border-0 bg-soda-pink p-0 text-[10px] text-soda-action-foreground">
            {Math.min(unread, 9)}
          </Badge>
        ) : null}
        <span className="sr-only">التنبيهات</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span>التنبيهات</span>
          <Link
            href="/notifications"
            className="cursor-pointer text-xs font-normal text-soda-pink hover:underline"
          >
            كل التنبيهات
          </Link>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <DropdownMenuItem disabled className="text-muted-foreground">
            مفيش تنبيهات دلوقتي
          </DropdownMenuItem>
        ) : (
          items.slice(0, 8).map((item) => {
            const href = safeHref(item);
            return (
              <DropdownMenuItem
                key={item.id}
                className="cursor-pointer items-start whitespace-normal"
                onClick={() => markRead(item.id)}
                render={<Link href={href} />}
              >
                <div className="min-w-0 space-y-0.5" dir="rtl">
                  <p className="font-ar text-sm font-medium">
                    {friendlyTitle(item)}
                  </p>
                  <p className="font-ar line-clamp-2 text-xs text-muted-foreground">
                    {item.body || notificationActionLabel(item)}
                  </p>
                  <p className="font-ar text-[11px] text-soda-pink">
                    {notificationActionLabel(item)}
                  </p>
                </div>
              </DropdownMenuItem>
            );
          })
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer justify-center font-medium text-soda-pink"
          render={<Link href="/notifications" />}
        >
          مركز التنبيهات
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
