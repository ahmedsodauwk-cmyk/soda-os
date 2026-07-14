"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

import { useNotificationLiveOptional } from "@/components/notifications/notification-live-store";
import {
  CategoryBadge,
  NT_MOTION,
  categoryGlyph,
  entityLine,
  formatNotificationWhen,
  notificationCardClass,
  signalGlyph,
  statusLine,
} from "@/components/notifications/notification-visuals";
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

function BellCard({ item }: { item: NotificationRecord }) {
  const unread = item.status === "unread";
  const priorityLabel = notificationPriorityLabel(item.priority);
  const signal = signalGlyph(item);

  return (
    <div
      className={cn(
        notificationCardClass(item, { compact: true }),
        "flex w-full gap-2.5"
      )}
      dir="rtl"
    >
      <div
        className={cn(
          NT_MOTION,
          "flex size-9 shrink-0 items-center justify-center rounded-lg text-base",
          unread
            ? "bg-soda-pink/15 ring-1 ring-soda-pink/25"
            : "bg-muted/60"
        )}
        aria-hidden
      >
        <span>{signal ?? categoryGlyph(item.category)}</span>
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-start gap-1.5">
          <span
            className={cn(
              NT_MOTION,
              "mt-1.5 size-2 shrink-0 rounded-full",
              unread
                ? "bg-soda-pink opacity-100 shadow-[0_0_0_3px_var(--soda-pink-soft)]"
                : "opacity-0"
            )}
            aria-hidden
          />
          <p
            className={cn(
              NT_MOTION,
              "font-ar text-sm leading-snug",
              unread
                ? "font-bold text-foreground"
                : "font-normal text-foreground/80"
            )}
          >
            {notificationDisplayTitle(item)}
            {priorityLabel ? (
              <span className="ms-1.5 text-[10px] font-normal text-soda-pink">
                {priorityLabel}
              </span>
            ) : null}
          </p>
        </div>
        <p className="font-ar truncate text-[11px] text-muted-foreground">
          {entityLine(item)} · <CategoryBadge category={item.category} />
        </p>
        <p className="font-ar line-clamp-2 text-xs text-muted-foreground">
          {notificationDisplayBody(item)}
        </p>
        <p className="font-ar text-[11px] text-soda-pink">
          {formatNotificationWhen(item.createdAt)} · {statusLine(item)}
        </p>
      </div>
    </div>
  );
}

export function HeaderNotifications({ initial }: HeaderNotificationsProps) {
  const live = useNotificationLiveOptional();
  const items = live?.items ?? initial;
  const unread =
    live?.unreadCount ?? items.filter((n) => n.status === "unread").length;

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
          <Badge
            className={cn(
              NT_MOTION,
              "absolute -top-0.5 -right-0.5 size-4 justify-center rounded-full border-0 bg-soda-pink p-0 text-[10px] text-soda-action-foreground",
              "shadow-[0_0_10px_color-mix(in_srgb,var(--soda-pink)_50%,transparent)]"
            )}
          >
            {Math.min(unread, 9)}
          </Badge>
        ) : null}
        <span className="sr-only">التنبيهات</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[22rem] max-w-[calc(100vw-1.5rem)] p-0"
      >
        <DropdownMenuLabel className="flex items-center justify-between gap-2 px-3 py-2.5">
          <span className="font-ar">التنبيهات</span>
          <div className="flex items-center gap-2">
            {unread > 0 ? (
              <span className="font-ar rounded-md bg-soda-pink/15 px-1.5 py-0.5 text-[10px] text-soda-pink">
                {unread} جديد
              </span>
            ) : null}
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
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-0" />
        <div className="max-h-[min(70vh,28rem)] space-y-1.5 overflow-y-auto p-2">
          {items.length === 0 ? (
            <div className="px-2 py-8 text-center">
              <p className="font-ar text-sm text-muted-foreground">
                مفيش تنبيهات دلوقتي
              </p>
            </div>
          ) : (
            items.slice(0, 8).map((item) => {
              const href = notificationHref(item);
              return (
                <DropdownMenuItem
                  key={item.id}
                  className="cursor-pointer items-stretch rounded-xl p-0 focus:bg-transparent"
                  onClick={() => onOpenItem(item)}
                  nativeButton={false}
                  render={<Link href={href} />}
                >
                  <BellCard item={item} />
                </DropdownMenuItem>
              );
            })
          )}
        </div>
        <DropdownMenuSeparator className="my-0" />
        <DropdownMenuItem
          className="font-ar cursor-pointer justify-center py-2.5 font-medium text-soda-pink"
          nativeButton={false}
          render={<Link href="/notifications" />}
        >
          مركز التنبيهات
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
