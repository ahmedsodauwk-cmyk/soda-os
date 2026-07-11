"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { ClientEntryActions } from "@/components/clients/client-entry-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { computeClientStats } from "@/lib/business/client-stats";
import type { Client } from "@/lib/clients/types";
import { getClientInvoiceOutstanding } from "@/lib/invoices/repository";
import type { Order } from "@/lib/orders/types";
import type { Payment } from "@/lib/payments/types";
import type { Project } from "@/lib/projects/types";

function egp(n: number) {
  return `${n.toLocaleString("en-EG")} EGP`;
}

interface CommercialClientsViewProps {
  clients: Client[];
  projects: Project[];
  orders: Order[];
  payments: Payment[];
}

export function CommercialClientsView({
  clients,
  projects,
  orders,
  payments,
}: CommercialClientsViewProps) {
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    return clients
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
  }, [clients, projects, orders, payments]);

  const filtered = rows.filter(({ client }) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      client.name.toLowerCase().includes(q) ||
      (client.company?.toLowerCase().includes(q) ?? false) ||
      (client.contactPerson?.toLowerCase().includes(q) ?? false) ||
      client.phone.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/clients" />}
          className="-ml-2"
        >
          ← Clients hub
        </Button>
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search commercial clients…"
            className="pl-9"
          />
        </div>
        <ClientEntryActions
          defaultType="company"
          defaultSegment="commercial"
          triggerLabel="+ New"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map(({ client, stats, outstanding, projects: pc, orders: oc }) => (
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
