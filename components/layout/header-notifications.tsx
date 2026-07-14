"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

import { useNotificationLiveOptional } from "@/components/notifications/notification-live-store";
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
import { cn } from "@/lib/utils";

interface HeaderNotificationsProps {
  initial: NotificationRecord[];
}

export function HeaderNotifications({ initial }: HeaderNotificationsProps) {
  const live = useNotificationLiveOptional();
  const items = live?.items ?? initial;
  const unread = live?.unreadCount ?? items.filter((n) => n.status === "unread").length;

  function onOpenItem(item: NotificationRecord) {
    if (item.status === "unread") {
      live?.markRead(item.id);
    }
  }

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
          {unread > 0 ? (
            <button
              type="button"
              className="font-ar cursor-pointer text-[11px] font-normal text-soda-pink hover:underline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                live?.markAllRead();
              }}
            >
              اقرأ الكل
            </button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <DropdownMenuItem disabled className="text-muted-foreground">
            مفيش تنبيهات دلوقتي
          </DropdownMenuItem>
        ) : (
          items.slice(0, 8).map((item) => {
            const href = notificationHref(item);
            const priorityLabel = notificationPriorityLabel(item.priority);
            const unreadItem = item.status === "unread";
            return (
              <DropdownMenuItem
                key={item.id}
                className={cn(
                  "cursor-pointer items-start whitespace-normal",
                  unreadItem && "bg-soda-pink/[0.06]"
                )}
                onClick={() => onOpenItem(item)}
                nativeButton={false}
                render={<Link href={href} />}
              >
                <div className="flex min-w-0 gap-2" dir="rtl">
                  {unreadItem ? (
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-soda-pink" />
                  ) : (
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-transparent" />
                  )}
                  <div className="min-w-0 space-y-0.5">
                    <p
                      className={cn(
                        "font-ar text-sm",
                        unreadItem
                          ? "font-semibold text-foreground"
                          : "font-medium text-foreground/85"
                      )}
                    >
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
