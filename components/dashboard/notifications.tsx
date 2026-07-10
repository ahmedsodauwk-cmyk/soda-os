"use client";

import { useState } from "react";
import {
  Bell,
  Calendar,
  Camera,
  CreditCard,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const notifications = [
  {
    id: 1,
    message: "Wedding delivery tomorrow",
    time: "2h ago",
    icon: Calendar,
    unread: true,
  },
  {
    id: 2,
    message: "Commercial shoot confirmed",
    time: "4h ago",
    icon: Camera,
    unread: true,
  },
  {
    id: 3,
    message: "Client Mamdouh paid deposit",
    time: "Yesterday",
    icon: CreditCard,
    unread: false,
  },
  {
    id: 4,
    message: "Nemo assigned to Friday shoot",
    time: "Yesterday",
    icon: UserPlus,
    unread: false,
  },
];

export default function Notifications() {
  const [items, setItems] = useState(notifications);

  function markAllRead() {
    setItems((current) =>
      current.map((item) => ({ ...item, unread: false }))
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardAction>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={markAllRead}
          >
            Mark all read
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50",
                item.unread && "border-l-2 border-primary bg-muted/30 pl-[10px]"
              )}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon className="size-4 text-muted-foreground" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm">{item.message}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.time}
                </p>
              </div>

              {item.unread && (
                <Bell className="mt-0.5 size-3.5 shrink-0 text-primary" />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
