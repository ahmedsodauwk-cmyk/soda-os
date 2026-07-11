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
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <DropdownMenuItem disabled className="text-muted-foreground">
            No recent activity
          </DropdownMenuItem>
        ) : (
          items.slice(0, 12).map((item) => (
            <DropdownMenuItem
              key={item.id}
              className="items-start whitespace-normal"
              onClick={() => markRead(item.id)}
            >
              {item.href ? (
                <Link href={item.href} className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {item.body}
                  </p>
                </Link>
              ) : (
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
