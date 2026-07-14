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
  notificationActionLabel,
  notificationDisplayBody,
  notificationDisplayTitle,
  notificationHref,
  notificationPriorityLabel,
} from "@/lib/core/notifications/engine";
import type { NotificationRecord } from "@/lib/core/types";

interface HeaderNotificationsProps {
  initial: NotificationRecord[];
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

  // Root cause of Menu Item / Link mismatch: Menu.Item defaults to nativeButton,
  // but render={<Link />} produces <a>. Must set nativeButton={false}.
  // (Base UI Error #31 is MenuGroupLabel outside Menu.Group — fixed in dropdown-menu.)
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
        <DropdownMenuLabel>التنبيهات</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <DropdownMenuItem disabled className="text-muted-foreground">
            مفيش تنبيهات دلوقتي
          </DropdownMenuItem>
        ) : (
          items.slice(0, 8).map((item) => {
            const href = notificationHref(item);
            const priorityLabel = notificationPriorityLabel(item.priority);
            return (
              <DropdownMenuItem
                key={item.id}
                className="cursor-pointer items-start whitespace-normal"
                onClick={() => markRead(item.id)}
                nativeButton={false}
                render={<Link href={href} />}
              >
                <div className="min-w-0 space-y-0.5" dir="rtl">
                  <p className="font-ar text-sm font-medium">
                    {notificationDisplayTitle(item)}
                    {priorityLabel ? (
                      <span className="ms-2 text-[10px] font-normal text-soda-pink">
                        {priorityLabel}
                      </span>
                    ) : null}
                  </p>
                  <p className="font-ar line-clamp-2 text-xs text-muted-foreground">
                    {notificationDisplayBody(item)}
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
          nativeButton={false}
          render={<Link href="/notifications" />}
        >
          مركز التنبيهات
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
