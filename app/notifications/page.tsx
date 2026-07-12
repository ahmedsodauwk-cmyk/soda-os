import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { RoleGate } from "@/components/identity/role-gate";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  hydrateNotificationsFromEvents,
  refreshBusinessEventsFromDb,
} from "@/lib/core";
import { notificationActionLabel } from "@/lib/core/notifications/engine";
import type { NotificationRecord } from "@/lib/core/types";
import { resolveSessionForApp } from "@/lib/identity/session";

export const dynamic = "force-dynamic";

function hrefForNotification(item: NotificationRecord): string {
  if (item.href?.startsWith("/")) return item.href;
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
      return "/";
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

export default async function NotificationsPage() {
  const session = await resolveSessionForApp();
  if (!session) redirect("/login");

  let notifications: NotificationRecord[] = [];
  try {
    const events = await refreshBusinessEventsFromDb(80).catch(() => []);
    notifications = hydrateNotificationsFromEvents(events);
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
              كل تنبيه بياخدك للأوردر أو العميل أو المالية المتعلقة بيه.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {notifications.length === 0 ? (
              <p className="font-ar text-sm text-muted-foreground" dir="rtl">
                مفيش تنبيهات دلوقتي. حركة الستوديو هتظهر هنا.
              </p>
            ) : (
              notifications.map((n) => {
                const href = hrefForNotification(n);
                const action = notificationActionLabel(n);
                return (
                  <div
                    key={n.id}
                    className="rounded-lg border border-transparent px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0" dir="rtl">
                        <p className="font-ar text-sm font-medium">
                          {friendlyTitle(n)}
                        </p>
                        <p className="font-ar line-clamp-2 text-xs text-muted-foreground">
                          {n.body || action}
                        </p>
                        <Link
                          href={href}
                          className="font-ar mt-1.5 inline-block cursor-pointer text-xs font-medium text-soda-pink hover:underline"
                        >
                          {action}
                        </Link>
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
