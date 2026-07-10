"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BUSINESS_TODAY } from "@/lib/business/types";
import { computeClientStats } from "@/lib/business/client-stats";
import type { Client } from "@/lib/clients/types";
import type { Order } from "@/lib/orders/types";
import type { Payment } from "@/lib/payments/types";
import type { Project } from "@/lib/projects/types";

interface WeddingClientsViewProps {
  clients: Client[];
  projects: Project[];
  orders: Order[];
  payments: Payment[];
}

export function WeddingClientsView({
  clients,
  projects,
  orders,
  payments,
}: WeddingClientsViewProps) {
  const [search, setSearch] = useState("");

  const enriched = useMemo(() => {
    return clients.map((client) => {
      const stats = computeClientStats(
        client.id,
        projects,
        orders,
        payments
      );
      const clientOrders = orders.filter((o) => o.clientId === client.id);
      const upcoming = clientOrders.filter(
        (o) =>
          o.shootDate >= BUSINESS_TODAY &&
          o.status !== "Cancelled" &&
          o.status !== "Delivered"
      );
      const past = clientOrders.filter(
        (o) => o.status === "Delivered" || o.shootDate < BUSINESS_TODAY
      );
      return { client, stats, upcoming, past, clientOrders };
    });
  }, [clients, projects, orders, payments]);

  const filtered = enriched.filter(({ client }) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      client.name.toLowerCase().includes(q) ||
      client.phone.includes(q) ||
      (client.email?.toLowerCase().includes(q) ?? false)
    );
  });

  const recent = [...filtered]
    .sort((a, b) => b.client.createdAt.localeCompare(a.client.createdAt))
    .slice(0, 6);
  const upcomingClients = filtered.filter((r) => r.upcoming.length > 0);
  const pastClients = filtered.filter(
    (r) => r.past.length > 0 && r.upcoming.length === 0
  );

  function ClientRow({
    client,
    hint,
  }: {
    client: Client;
    hint: string;
  }) {
    return (
      <Link
        href={`/clients/${client.id}`}
        className="flex items-center justify-between rounded-xl border border-border/60 px-3.5 py-3 hover:border-soda-pink/35"
      >
        <div>
          <p className="font-medium">{client.name}</p>
          <p className="text-xs text-muted-foreground">
            {client.phone}
            {client.email ? ` · ${client.email}` : ""}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </Link>
    );
  }

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
            placeholder="Search wedding clients…"
            className="pl-9"
          />
        </div>
      </div>

      <section className="space-y-2">
        <h3 className="font-heading text-base font-semibold">Recent</h3>
        <div className="space-y-2">
          {recent.map(({ client, clientOrders }) => (
            <ClientRow
              key={client.id}
              client={client}
              hint={`${clientOrders.length} orders`}
            />
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-heading text-base font-semibold">Upcoming</h3>
        <div className="space-y-2">
          {upcomingClients.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming shoots.</p>
          ) : (
            upcomingClients.map(({ client, upcoming }) => (
              <ClientRow
                key={client.id}
                client={client}
                hint={`Next ${upcoming[0]?.shootDate}`}
              />
            ))
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-heading text-base font-semibold">Past clients</h3>
        <div className="space-y-2">
          {pastClients.length === 0 ? (
            <p className="text-sm text-muted-foreground">No past clients yet.</p>
          ) : (
            pastClients.map(({ client, past }) => (
              <ClientRow
                key={client.id}
                client={client}
                hint={`${past.length} past orders`}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
