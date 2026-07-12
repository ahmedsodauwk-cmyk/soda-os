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

function friendlyTitle(item: NotificationRecord): string {
  const t = item.title?.trim();
  if (!t) return "Activity update";
  if (/^[A-Z][a-zA-Z]+(?:[A-Z][a-zA-Z]+)+$/.test(t)) {
    return t.replace(/([a-z])([A-Z])/g, "$1 $2");
  }
  return t;
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
            <CardTitle>Notification center</CardTitle>
            <CardDescription>
              Every item opens the related order, client, project, or finance
              page. Confirm and decline actions will appear here later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No notifications yet. Studio activity will show up here.
              </p>
            ) : (
              notifications.map((n) => {
                const href = hrefForNotification(n);
                return (
                  <div
                    key={n.id}
                    className="rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-border/70 hover:bg-muted/40"
                  >
                    <Link href={href} className="block">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {friendlyTitle(n)}
                          </p>
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {n.body || "Open related record"}
                          </p>
                        </div>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {n.createdAt.slice(0, 16).replace("T", " ")}
                        </span>
                      </div>
                    </Link>
                    {/* Action slots reserved for future Confirm / Decline — view only for now */}
                    {n.actions && n.actions.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {n.actions
                          .filter((a) => a.kind === "view" && a.enabled !== false)
                          .map((a) => (
                            <Link
                              key={`${n.id}-${a.kind}`}
                              href={a.href ?? href}
                              className="text-xs font-medium text-soda-pink hover:underline"
                            >
                              {a.label}
                            </Link>
                          ))}
                      </div>
                    ) : null}
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
