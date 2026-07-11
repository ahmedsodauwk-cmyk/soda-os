import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeClientStats } from "@/lib/business/client-stats";
import {
  getClientsBySegment,
  refreshClients,
} from "@/lib/clients/repository";
import { getOrders } from "@/lib/orders/repository";
import { getPayments } from "@/lib/payments/repository";
import { getProjects } from "@/lib/projects/repository";
import { getClientInvoiceOutstanding } from "@/lib/invoices/repository";

function egp(n: number) {
  return `${n.toLocaleString("en-EG")} EGP`;
}

export async function CommercialClientsView() {
  await refreshClients();
  const clients = getClientsBySegment("commercial");
  const projects = getProjects();
  const orders = getOrders();
  const payments = getPayments();

  const rows = clients
    .map((client) => {
      const stats = computeClientStats(client.id, projects, orders, payments);
      const invoiceOut = getClientInvoiceOutstanding(client.id);
      return {
        client,
        stats,
        outstanding: Math.max(stats.outstandingBalance, invoiceOut),
        projects: projects.filter((p) => p.clientId === client.id).length,
        orders: orders.filter((o) => o.clientId === client.id).length,
      };
    })
    .sort((a, b) => b.stats.revenue - a.stats.revenue);

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        render={<Link href="/clients" />}
        className="-ml-2"
      >
        ← Clients hub
      </Button>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map(({ client, stats, outstanding, projects: pc, orders: oc }) => (
          <Link key={client.id} href={`/clients/${client.id}`} className="group block">
            <Card className="soda-cc-card h-full group-hover:border-soda-pink/35">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-sm font-semibold">
                    {(client.company ?? client.name).slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <CardTitle className="text-base">{client.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {client.contactPerson ?? "—"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[11px] text-muted-foreground">Revenue</p>
                  <p className="font-mono text-xs font-medium">
                    {egp(stats.revenue)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Outstanding</p>
                  <p className="font-mono text-xs font-medium text-soda-pink">
                    {egp(outstanding)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Projects</p>
                  <p className="font-mono font-medium">{pc}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Orders</p>
                  <p className="font-mono font-medium">{oc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
