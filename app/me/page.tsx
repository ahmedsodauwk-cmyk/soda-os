import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { RoleGate } from "@/components/identity/role-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveSessionForApp } from "@/lib/identity/session";
import { navForRole } from "@/lib/identity/nav";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MeHomePage() {
  const session = await resolveSessionForApp();
  if (!session) redirect("/login");

  return (
    <RoleGate session={session} anyOf={["dashboard.crew", "me.performance"]}>
      <AppShell title="My Dashboard" subtitle="Your shoots, wallet, and targets">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {navForRole(session.profile.role)
            .filter((i) => i.href.startsWith("/me/") || i.href === "/orders" || i.href === "/calendar" || i.href === "/notifications")
            .map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl border border-border/70 bg-card/60 p-4 transition-colors hover:border-soda-pink/40"
                >
                  <Card className="border-0 bg-transparent shadow-none">
                    <CardHeader className="flex-row items-center gap-3 p-0">
                      <Icon className="size-5 text-soda-pink" />
                      <CardTitle className="text-base">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 pt-2 text-xs text-muted-foreground">
                      Open {item.title.toLowerCase()}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
        </div>
      </AppShell>
    </RoleGate>
  );
}
