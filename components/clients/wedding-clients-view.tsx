"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Search } from "lucide-react";

import { ClientEntryActions } from "@/components/clients/client-entry-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getBusinessToday } from "@/lib/business/types";
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

function monthLabel(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}

export function WeddingClientsView({
  clients,
  projects,
  orders,
  payments,
}: WeddingClientsViewProps) {
  const [search, setSearch] = useState("");
  const [browseYear, setBrowseYear] = useState<number | null>(null);
  const [browseMonth, setBrowseMonth] = useState<string | null>(null);

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
          o.shootDate >= getBusinessToday() &&
          o.status !== "Cancelled" &&
          o.status !== "Delivered"
      );
      const past = clientOrders.filter(
        (o) => o.status === "Delivered" || o.shootDate < getBusinessToday()
      );
      return { client, stats, upcoming, past, clientOrders };
    });
  }, [clients, projects, orders, payments]);

  const filtered = useMemo(
    () =>
      enriched.filter(({ client }) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          client.name.toLowerCase().includes(q) ||
          client.phone.includes(q) ||
          (client.email?.toLowerCase().includes(q) ?? false)
        );
      }),
    [enriched, search]
  );

  const recent = [...filtered]
    .sort((a, b) => b.client.createdAt.localeCompare(a.client.createdAt))
    .slice(0, 6);
  const upcomingClients = filtered.filter((r) => r.upcoming.length > 0);

  /** Year → Month → Clients from shoot months (all non-cancelled orders). */
  const byYearMonth = useMemo(() => {
    const years = new Map<number, Map<string, typeof filtered>>();
    for (const row of filtered) {
      const months = new Set<string>();
      for (const order of row.clientOrders) {
        if (order.status === "Cancelled") continue;
        if (order.shootDate?.length >= 7) months.add(order.shootDate.slice(0, 7));
      }
      // Clients with no shoot dates still appear under createdAt month
      if (months.size === 0 && row.client.createdAt?.length >= 7) {
        months.add(row.client.createdAt.slice(0, 7));
      }
      for (const monthKey of months) {
        const year = Number(monthKey.slice(0, 4));
        const monthMap = years.get(year) ?? new Map<string, typeof filtered>();
        const existing = monthMap.get(monthKey) ?? [];
        const list = existing.some((r) => r.client.id === row.client.id)
          ? existing
          : [...existing, row];
        monthMap.set(monthKey, list);
        years.set(year, monthMap);
      }
    }
    return years;
  }, [filtered]);

  const yearsDesc = [...byYearMonth.keys()].sort((a, b) => b - a);

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
        className="flex cursor-pointer items-center justify-between rounded-xl border border-border/60 px-3.5 py-3 hover:border-soda-pink/35"
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
          className="-ml-2 cursor-pointer"
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
        <ClientEntryActions defaultType="individual" defaultSegment="wedding" />
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

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-heading text-base font-semibold">
            Browse by Month
          </h3>
          {browseYear != null || browseMonth != null ? (
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer gap-1"
              onClick={() => {
                if (browseMonth != null) setBrowseMonth(null);
                else setBrowseYear(null);
              }}
            >
              <ChevronLeft className="size-3.5" />
              Back
            </Button>
          ) : null}
        </div>

        {browseMonth != null && browseYear != null ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {monthLabel(browseMonth)}
            </p>
            {(byYearMonth.get(browseYear)?.get(browseMonth) ?? []).map(
              ({ client, clientOrders }) => (
                <ClientRow
                  key={client.id}
                  client={client}
                  hint={`${clientOrders.length} orders`}
                />
              )
            )}
            {(byYearMonth.get(browseYear)?.get(browseMonth) ?? []).length ===
            0 ? (
              <p className="text-sm text-muted-foreground">
                No clients in this month.
              </p>
            ) : null}
          </div>
        ) : browseYear != null ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[...(byYearMonth.get(browseYear)?.entries() ?? [])]
              .sort((a, b) => b[0].localeCompare(a[0]))
              .map(([monthKey, rows]) => (
                <button
                  key={monthKey}
                  type="button"
                  onClick={() => setBrowseMonth(monthKey)}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-border/60 px-3.5 py-3 text-left transition-colors hover:border-soda-pink/35"
                >
                  <span className="font-medium">{monthLabel(monthKey)}</span>
                  <span className="text-xs text-muted-foreground">
                    {rows.length} client{rows.length === 1 ? "" : "s"}
                  </span>
                </button>
              ))}
          </div>
        ) : yearsDesc.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No wedding clients to browse yet.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {yearsDesc.map((year) => {
              const months = byYearMonth.get(year)!;
              const clientCount = new Set(
                [...months.values()].flatMap((rows) =>
                  rows.map((r) => r.client.id)
                )
              ).size;
              return (
                <button
                  key={year}
                  type="button"
                  onClick={() => setBrowseYear(year)}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-border/60 px-3.5 py-3 text-left transition-colors hover:border-soda-pink/35"
                >
                  <span className="font-heading text-lg font-semibold">
                    {year}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {months.size} month{months.size === 1 ? "" : "s"} ·{" "}
                    {clientCount} client{clientCount === 1 ? "" : "s"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
