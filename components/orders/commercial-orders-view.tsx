import Link from "next/link";

import { OrderEntryActions } from "@/components/orders/order-entry-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeClientStats } from "@/lib/business/client-stats";
import { getClientsBySegment } from "@/lib/clients/repository";
import { getOrders } from "@/lib/orders/repository";
import { getPayments } from "@/lib/payments/repository";
import { getProjects } from "@/lib/projects/repository";

function egp(n: number) {
  return `${n.toLocaleString("en-EG")} EGP`;
}

export function CommercialOrdersView() {
  const companies = getClientsBySegment("commercial");
  const projects = getProjects();
  const orders = getOrders();
  const payments = getPayments();

  const rows = companies
    .map((client) => {
      const stats = computeClientStats(client.id, projects, orders, payments);
      const clientOrders = orders.filter((o) => o.clientId === client.id);
      const clientProjects = projects.filter((p) => p.clientId === client.id);
      return {
        client,
        stats,
        orderCount: clientOrders.length,
        projectCount: clientProjects.length,
      };
    })
    .filter((r) => r.orderCount > 0 || r.projectCount > 0)
    .sort((a, b) => b.stats.revenue - a.stats.revenue);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/orders" />}
          className="-ml-2"
        >
          ← Orders hub
        </Button>
        <OrderEntryActions
          defaultProjectType="Commercial"
          triggerLabel="+ New"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map(({ client, stats, orderCount, projectCount }) => (
          <Link
            key={client.id}
            href={`/orders/commercial/${client.id}`}
            className="group block"
          >
            <Card className="soda-cc-card h-full group-hover:border-soda-pink/35">
              <CardHeader>
                <CardTitle className="text-base">{client.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {client.contactPerson ?? "Commercial account"}
                </p>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-[11px] text-muted-foreground">Projects</p>
                  <p className="font-mono font-medium">{projectCount}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Orders</p>
                  <p className="font-mono font-medium">{orderCount}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Outstanding</p>
                  <p className="font-mono font-medium text-soda-pink">
                    {egp(stats.outstandingBalance)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
