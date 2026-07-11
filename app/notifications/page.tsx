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
import { resolveSessionForApp } from "@/lib/identity/session";

export const dynamic = "force-dynamic";

function hrefForNotification(item: {
  href?: string;
  entityType: string;
  entityId: string;
}): string {
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
      return "/calendar";
  }
}

export default async function NotificationsPage() {
  const session = await resolveSessionForApp();
  if (!session) redirect("/login");

  const events = await refreshBusinessEventsFromDb(80).catch(() => []);
  const notifications = hydrateNotificationsFromEvents(events);

  return (
    <RoleGate session={session} anyOf={["notifications.view"]}>
      <AppShell
        title="Notifications"
        subtitle="Orders, clients, finance, and calendar activity"
      >
        <Card className="soda-cc-card">
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <CardDescription>
              Every item opens the related order, client, project, or finance page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={hrefForNotification(n)}
                  className="block rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-border/70 hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {n.body}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {n.createdAt.slice(0, 16).replace("T", " ")}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </AppShell>
    </RoleGate>
  );
}
