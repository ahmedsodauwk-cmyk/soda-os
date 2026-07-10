"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { getClients } from "@/lib/clients/repository";
import { getOrders } from "@/lib/orders/repository";
import { getProjects } from "@/lib/projects/repository";
import { searchQuotations } from "@/lib/quotations";

type SearchHit = {
  id: string;
  label: string;
  detail: string;
  href: string;
  kind: "quotation" | "client" | "order" | "project";
};

function buildHits(query: string): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const hits: SearchHit[] = [];

  for (const item of searchQuotations(q).slice(0, 5)) {
    hits.push({
      id: item.id,
      label: item.number,
      detail: `${item.clientName} · ${item.pipelineStage}`,
      href: `/quotations/${item.id}`,
      kind: "quotation",
    });
  }

  for (const c of getClients()) {
    const hay = [c.name, c.company, c.contactPerson, c.phone, c.email]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) continue;
    hits.push({
      id: c.id,
      label: c.name,
      detail: c.segment,
      href: `/clients/${c.id}`,
      kind: "client",
    });
    if (hits.filter((h) => h.kind === "client").length >= 4) break;
  }

  for (const o of getOrders()) {
    const hay = [o.id, o.clientName, o.projectType, o.location]
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) continue;
    hits.push({
      id: o.id,
      label: o.id,
      detail: `${o.clientName} · ${o.status}`,
      href: "/orders",
      kind: "order",
    });
    if (hits.filter((h) => h.kind === "order").length >= 4) break;
  }

  for (const p of getProjects()) {
    const hay = [p.id, p.name, p.clientName].join(" ").toLowerCase();
    if (!hay.includes(q)) continue;
    hits.push({
      id: p.id,
      label: p.name,
      detail: p.clientName,
      href: `/projects/${p.id}`,
      kind: "project",
    });
    if (hits.filter((h) => h.kind === "project").length >= 4) break;
  }

  return hits.slice(0, 12);
}

const KIND_LABEL: Record<SearchHit["kind"], string> = {
  quotation: "Quote",
  client: "Client",
  order: "Order",
  project: "Project",
};

export function HeaderSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const hits = useMemo(() => buildHits(query), [query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={rootRef} className="relative hidden sm:block">
      <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search…"
        className="h-8 w-48 pl-8 lg:w-64"
        aria-autocomplete="list"
        aria-expanded={open && hits.length > 0}
      />
      {open && query.trim().length >= 2 ? (
        <div className="absolute top-full right-0 z-50 mt-1 w-80 overflow-hidden rounded-xl border border-border/80 bg-popover shadow-lg">
          {hits.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              No matches
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {hits.map((hit) => (
                <li key={`${hit.kind}-${hit.id}`}>
                  <Link
                    href={hit.href}
                    className="flex items-start gap-2 px-3 py-2 hover:bg-muted/60"
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <span className="mt-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {KIND_LABEL[hit.kind]}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {hit.label}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {hit.detail}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
