import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { RoleGate } from "@/components/identity/role-gate";
import { NotificationDecisionButtons } from "@/components/notifications/notification-decision-buttons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loadHydratedNotifications } from "@/lib/core/notifications/load";
import {
  notificationActionLabel,
  notificationDisplayBody,
  notificationDisplayTitle,
  notificationHref,
  notificationPriorityLabel,
} from "@/lib/core/notifications/engine";
import type { NotificationRecord } from "@/lib/core/types";
import { resolveSessionForApp } from "@/lib/identity/session";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function priorityClass(priority: NotificationRecord["priority"]): string {
  switch (priority) {
    case "urgent":
      return "border-destructive/40 bg-destructive/5";
    case "high":
      return "border-soda-pink/25 bg-soda-pink/5";
    default:
      return "border-transparent";
  }
}

export default async function NotificationsPage() {
  const session = await resolveSessionForApp();
  if (!session) redirect("/login");

  // Same hydrate path as AppShell bell — Human Notification Layer only.
  let notifications: NotificationRecord[] = [];
  try {
    notifications = await loadHydratedNotifications();
  } catch {
    notifications = [];
  }

  return (
    <RoleGate session={session} anyOf={["notifications.view"]}>
      <AppShell
        titleKey="pages.notifications"
        layer="notifications"
        session={session}
      >
        <Card className="soda-cc-card">
          <CardHeader>
            <CardTitle>مركز التنبيهات</CardTitle>
            <CardDescription dir="rtl" className="font-ar">
              تنبيهات بشرية من حركة الستوديو — من غير أسماء تقنية.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {notifications.length === 0 ? (
              <p className="font-ar text-sm text-muted-foreground" dir="rtl">
                مفيش تنبيهات دلوقتي. حركة الستوديو هتظهر هنا.
              </p>
            ) : (
              notifications.map((n) => {
                const href = notificationHref(n);
                const action = notificationActionLabel(n);
                const priorityLabel = notificationPriorityLabel(n.priority);
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "rounded-lg border px-3 py-2.5",
                      priorityClass(n.priority)
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0" dir="rtl">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-ar text-sm font-medium">
                            {notificationDisplayTitle(n)}
                          </p>
                          {priorityLabel ? (
                            <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {priorityLabel}
                            </span>
                          ) : null}
                        </div>
                        <p className="font-ar line-clamp-2 text-xs text-muted-foreground">
                          {notificationDisplayBody(n)}
                        </p>
                        <Link
                          href={href}
                          className="font-ar mt-1.5 inline-block cursor-pointer text-xs font-medium text-soda-pink hover:underline"
                        >
                          {action}
                        </Link>
                        <NotificationDecisionButtons actions={n.actions} />
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {n.createdAt.slice(0, 16).replace("T", " ")}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </AppShell>
    </RoleGate>
  );
}
