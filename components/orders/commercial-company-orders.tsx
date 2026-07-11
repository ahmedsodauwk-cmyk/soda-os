import Link from "next/link";
import { notFound } from "next/navigation";

import { MonthlyAccountPanel } from "@/components/business/monthly-account-panel";
import { HumanExplanation } from "@/components/brand/human-title";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBusinessToday } from "@/lib/business/types";
import { getCommercialClientProfile } from "@/lib/business/commercial-account";
import { getClientById } from "@/lib/clients/repository";
import { getOrdersByClient } from "@/lib/orders/repository";
import { getProjectsByClient } from "@/lib/projects/repository";
import {
  getDeliveriesByClient,
  getInvoicesByClient,
} from "@/lib/invoices/repository";

function egp(n: number) {
  return `${n.toLocaleString("en-EG")} EGP`;
}

interface CommercialCompanyOrdersProps {
  companyId: string;
}

export function CommercialCompanyOrders({
  companyId,
}: CommercialCompanyOrdersProps) {
  const client = getClientById(companyId);
  if (!client || client.segment !== "commercial") notFound();

  const profile = getCommercialClientProfile(
    companyId,
    getBusinessToday().slice(0, 7)
  );
  const projects = getProjectsByClient(companyId);
  const orders = getOrdersByClient(companyId);
  const deliveries = getDeliveriesByClient(companyId);
  const invoices = getInvoicesByClient(companyId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/orders/commercial" />}
          className="-ml-2"
        >
          ← Commercial companies
        </Button>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href={`/clients/${companyId}`} />}
        >
          Open full client profile
        </Button>
      </div>

      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          {client.name}
        </h2>
        <p className="text-sm text-muted-foreground">
          Projects → Orders → Deliveries → Invoices
        </p>
      </div>

      {profile ? (
        <MonthlyAccountPanel account={profile.monthlyAccount} />
      ) : null}

      <section className="space-y-3">
        <h3 className="font-heading text-base font-semibold">Projects</h3>
        <ul className="space-y-2">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/projects/${p.id}`}
                className="flex items-center justify-between rounded-xl border border-border/60 px-3.5 py-3 hover:border-soda-pink/35"
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.journeyStage ?? "—"} · {p.status}
                  </p>
                </div>
                <p className="font-mono text-xs">{egp(p.revenue)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="font-heading text-base font-semibold">Orders</h3>
        <ul className="space-y-2">
          {orders.map((o) => (
            <li
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 px-3.5 py-3"
            >
              <div>
                <p className="font-medium">{o.id}</p>
                <p className="text-xs text-muted-foreground">
                  Shoot {o.shootDate} · Delivery {o.deliveryDate}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs">{egp(o.price)}</span>
                <OrderStatusBadge status={o.status} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deliveries</CardTitle>
            <HumanExplanation layer="deliveries" size="compact" />
          </CardHeader>
          <CardContent className="space-y-2">
            {deliveries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deliveries.</p>
            ) : (
              deliveries.map((d) => (
                <div key={d.id} className="rounded-lg border border-border/50 px-3 py-2 text-sm">
                  <p className="font-medium">{d.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.status} · due {d.dueDate}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoices</CardTitle>
            <HumanExplanation layer="invoices" size="compact" />
          </CardHeader>
          <CardContent className="space-y-2">
            {invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invoices.</p>
            ) : (
              invoices.map((inv) => (
                <div key={inv.id} className="rounded-lg border border-border/50 px-3 py-2 text-sm">
                  <p className="font-medium">{inv.number}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.status} · {egp(inv.amount)} · paid {egp(inv.paidAmount)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
