import Link from "next/link";
import { notFound } from "next/navigation";

import { MonthlyAccountPanel } from "@/components/business/monthly-account-panel";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BUSINESS_TODAY } from "@/lib/business/types";
import { getCommercialClientProfile } from "@/lib/business/commercial-account";
import { computeClientStats } from "@/lib/business/client-stats";
import { getClientById } from "@/lib/clients/repository";
import { getOrders } from "@/lib/orders/repository";
import { getPayments } from "@/lib/payments/repository";
import { getProjects } from "@/lib/projects/repository";
import { getClientQuotationStats } from "@/lib/quotations";
import {
  formatEgp as formatQuoteEgp,
  formatShortDate,
} from "@/lib/quotations/utils";

function egp(n: number) {
  return `${n.toLocaleString("en-EG")} EGP`;
}

function ClientQuotationsSection({ clientId }: { clientId: string }) {
  const stats = getClientQuotationStats(clientId);
  if (stats.totalCount === 0) return null;

  return (
    <section className="space-y-3">
      <h3 className="font-heading text-base font-semibold">Quotations</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total quotes", String(stats.totalCount)],
          [
            "Win / loss",
            stats.winLossRatio == null
              ? "—"
              : `${Math.round(stats.winLossRatio * 100)}% (${stats.wonCount}/${stats.wonCount + stats.lostCount})`,
          ],
          ["Quote value", formatQuoteEgp(stats.totalQuotationValue)],
          [
            "Avg project size",
            stats.averageProjectSize == null
              ? "—"
              : formatQuoteEgp(stats.averageProjectSize),
          ],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-lg font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <ul className="space-y-2">
        {stats.quotations.map((q) => (
          <li key={q.id}>
            <Link
              href={`/quotations/${q.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 px-3.5 py-3 hover:border-soda-pink/35"
            >
              <div>
                <p className="font-medium">
                  {q.number} · {q.projectInfo.title || q.category}
                </p>
                <p className="text-xs text-muted-foreground">
                  {q.pipelineStage} · {q.approvalStatus} · close{" "}
                  {formatShortDate(q.expectedClosingDate)}
                </p>
              </div>
              <Badge variant="outline">{formatQuoteEgp(q.estimatedValue)}</Badge>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface ClientProfileProps {
  clientId: string;
}

export function ClientProfile({ clientId }: ClientProfileProps) {
  const client = getClientById(clientId);
  if (!client) notFound();

  if (client.segment === "commercial") {
    const profile = getCommercialClientProfile(
      clientId,
      BUSINESS_TODAY.slice(0, 7)
    );
    if (!profile) notFound();

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/clients/commercial" />}
            className="-ml-2"
          >
            ← Commercial clients
          </Button>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={`/orders/commercial/${clientId}`} />}
          >
            Orders drill-down
          </Button>
        </div>

        <div className="flex flex-wrap items-start gap-4">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--soda-purple),var(--soda-pink))] text-lg font-bold text-white">
            {(client.company ?? client.name).slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              {client.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {client.contactPerson ?? "—"} · {client.phone}
              {client.email ? ` · ${client.email}` : ""}
            </p>
            {client.notes ? (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {client.notes}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Revenue", egp(profile.revenue)],
            ["Projects", String(profile.projectCount)],
            ["Orders", String(profile.orderCount)],
            ["Avg project", egp(profile.avgProjectValue)],
            ["Outstanding", egp(profile.totalOutstanding)],
          ].map(([label, value]) => (
            <Card key={label}>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-lg font-semibold">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <ClientQuotationsSection clientId={clientId} />

        <MonthlyAccountPanel
          account={profile.monthlyAccount}
          title="Monthly account / settlement"
        />

        {client.contacts && client.contacts.length > 0 ? (
          <section className="space-y-2">
            <h3 className="font-heading text-base font-semibold">Contacts</h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {client.contacts.map((c) => (
                <li
                  key={`${c.name}-${c.role}`}
                  className="rounded-xl border border-border/60 px-3.5 py-3 text-sm"
                >
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.role}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[c.phone, c.email].filter(Boolean).join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="space-y-2">
          <h3 className="font-heading text-base font-semibold">Projects</h3>
          <ul className="space-y-2">
            {profile.projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.id}`}
                  className="flex items-center justify-between rounded-xl border border-border/60 px-3.5 py-3 hover:border-soda-pink/35"
                >
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Stage: {p.journeyStage ?? "—"} · {p.status}
                    </p>
                  </div>
                  <Badge variant="outline">{egp(p.revenue)}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="font-heading text-base font-semibold">Orders</h3>
          <ul className="space-y-2">
            {profile.orders.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 px-3.5 py-3"
              >
                <div>
                  <p className="font-medium">{o.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.shootDate} → {o.deliveryDate}
                  </p>
                </div>
                <OrderStatusBadge status={o.status} />
              </li>
            ))}
          </ul>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoices & payments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {profile.invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="rounded-lg border border-border/50 px-3 py-2 text-sm"
                >
                  <p className="font-medium">{inv.number}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.periodMonth} · {inv.status} · {egp(inv.amount)} · paid{" "}
                    {egp(inv.paidAmount)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Deliveries & files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {profile.deliveries.map((d) => (
                <div
                  key={d.id}
                  className="rounded-lg border border-border/50 px-3 py-2 text-sm"
                >
                  <p className="font-medium">{d.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.status} · due {d.dueDate}
                  </p>
                </div>
              ))}
              {profile.projects.flatMap((p) => p.files.slice(0, 2)).map((f) => (
                <div
                  key={f.id}
                  className="rounded-lg border border-border/50 px-3 py-2 text-sm"
                >
                  <p className="font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.type} · {f.size}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity & notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.projects.flatMap((p) =>
              p.activity.slice(0, 2).map((a) => (
                <div key={a.id} className="text-sm">
                  <p className="font-medium">
                    {a.actor} — {a.action}
                  </p>
                  <p className="text-xs text-muted-foreground">{a.createdAt}</p>
                </div>
              ))
            )}
            {client.notes ? (
              <p className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                {client.notes}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Wedding / individual profile
  const stats = computeClientStats(
    clientId,
    getProjects(),
    getOrders(),
    getPayments()
  );
  const orders = getOrders().filter((o) => o.clientId === clientId);
  const projects = getProjects().filter((p) => p.clientId === clientId);

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        render={<Link href="/clients/weddings" />}
        className="-ml-2"
      >
        ← Wedding clients
      </Button>
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          {client.name}
        </h2>
        <p className="text-sm text-muted-foreground">
          {client.phone}
          {client.email ? ` · ${client.email}` : ""}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-xl font-semibold">{stats.totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-xl font-semibold">{egp(stats.revenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">
              Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-xl font-semibold text-soda-pink">
              {egp(stats.outstandingBalance)}
            </p>
          </CardContent>
        </Card>
      </div>

      <ClientQuotationsSection clientId={clientId} />

      <section className="space-y-2">
        <h3 className="font-heading text-base font-semibold">Projects</h3>
        {projects.map((p) => (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            className="block rounded-xl border border-border/60 px-3.5 py-3 hover:border-soda-pink/35"
          >
            {p.name} · {p.journeyStage}
          </Link>
        ))}
      </section>
      <section className="space-y-2">
        <h3 className="font-heading text-base font-semibold">Orders</h3>
        {orders.map((o) => (
          <div
            key={o.id}
            className="flex items-center justify-between rounded-xl border border-border/60 px-3.5 py-3"
          >
            <div>
              <p className="font-medium">{o.id}</p>
              <p className="text-xs text-muted-foreground">{o.shootDate}</p>
            </div>
            <OrderStatusBadge status={o.status} />
          </div>
        ))}
      </section>
    </div>
  );
}
