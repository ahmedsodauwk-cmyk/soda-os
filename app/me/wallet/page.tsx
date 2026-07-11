import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { RoleGate } from "@/components/identity/role-gate";
import { BackLink } from "@/components/navigation/back-link";
import { RelatedRecords } from "@/components/navigation/related-records";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resolveSessionForApp } from "@/lib/identity/session";
import { refreshAllDomainData } from "@/lib/supabase/refresh-all";
import { getCrewWallet } from "@/lib/wallets/crew-wallet";
import { formatPrice } from "@/lib/orders/utils";

export const dynamic = "force-dynamic";

export default async function MeWalletPage() {
  const session = await resolveSessionForApp();
  if (!session) redirect("/login");

  await refreshAllDomainData().catch(() => undefined);
  const personId = session.profile.personId;
  const wallet = personId ? getCrewWallet(personId) : null;

  return (
    <RoleGate session={session} anyOf={["me.wallet"]}>
      <AppShell title="Wallet" subtitle="Pending and paid earnings">
        <BackLink href="/me" label="My Dashboard" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="soda-cc-card lg:col-span-2">
            <CardHeader>
              <CardTitle>Earnings</CardTitle>
              <CardDescription>
                {personId
                  ? "Tap a row to open the related order"
                  : "Link your profile to a crew member in Settings to see live wallet rows."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {!wallet || wallet.earnings.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No wallet rows yet. Completed assignments appear here.
                </p>
              ) : (
                wallet.earnings.slice(0, 40).map((e) => {
                  const href = e.orderId
                    ? `/orders/${e.orderId}`
                    : e.clientId
                      ? `/clients/${e.clientId}`
                      : e.projectId
                        ? `/projects/${e.projectId}`
                        : "/me/wallet";
                  return (
                    <Link
                      key={e.id}
                      href={href}
                      className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-sm hover:border-soda-pink/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {e.clientName ?? e.role}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {e.status}
                          {e.projectName ? ` · ${e.projectName}` : ""}
                        </p>
                      </div>
                      <span className="font-mono tabular-nums">
                        {formatPrice(e.amount)}
                      </span>
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="soda-cc-card">
              <CardHeader>
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pending</span>
                  <Link href="/me/wallet" className="font-mono hover:text-soda-pink">
                    {formatPrice(wallet?.pendingTotal ?? 0)}
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-mono">
                    {formatPrice(wallet?.paidTotal ?? 0)}
                  </span>
                </div>
              </CardContent>
            </Card>
            <RelatedRecords
              items={[
                { label: "Orders", href: "/orders", detail: "Assignments" },
                { label: "Bonus", href: "/me/bonus" },
                { label: "Target", href: "/me/target" },
                { label: "Calendar", href: "/calendar" },
              ]}
            />
          </div>
        </div>
      </AppShell>
    </RoleGate>
  );
}
