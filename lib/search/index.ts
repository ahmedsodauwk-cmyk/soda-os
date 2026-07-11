/**
 * Global search — clients, projects, orders, crew, files, invoices, payments.
 * Reads from module caches (refresh via refreshAll / page loaders).
 */
import { getClients } from "@/lib/clients/repository";
import { getFiles } from "@/lib/files/repository";
import { getInvoices } from "@/lib/invoices/repository";
import { getOrders } from "@/lib/orders/repository";
import { getPayments } from "@/lib/payments/repository";
import { getPeople } from "@/lib/people/repository";
import { getProjects } from "@/lib/projects/repository";
import { searchQuotations } from "@/lib/quotations";

export type SearchHitKind =
  | "quotation"
  | "client"
  | "order"
  | "project"
  | "crew"
  | "file"
  | "invoice"
  | "payment";

export interface SearchHit {
  id: string;
  label: string;
  detail: string;
  href: string;
  kind: SearchHitKind;
}

const KIND_LIMIT: Record<SearchHitKind, number> = {
  quotation: 4,
  client: 4,
  order: 4,
  project: 4,
  crew: 4,
  file: 3,
  invoice: 3,
  payment: 3,
};

function pushCapped(
  hits: SearchHit[],
  hit: SearchHit,
  counts: Partial<Record<SearchHitKind, number>>
): void {
  const n = counts[hit.kind] ?? 0;
  if (n >= KIND_LIMIT[hit.kind]) return;
  hits.push(hit);
  counts[hit.kind] = n + 1;
}

/** Build ranked search hits for the header / global search. */
export function buildGlobalSearchHits(query: string): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const hits: SearchHit[] = [];
  const counts: Partial<Record<SearchHitKind, number>> = {};

  for (const item of searchQuotations(q).slice(0, KIND_LIMIT.quotation)) {
    pushCapped(
      hits,
      {
        id: item.id,
        label: item.number,
        detail: `${item.clientName} · ${item.pipelineStage}`,
        href: `/quotations/${item.id}`,
        kind: "quotation",
      },
      counts
    );
  }

  for (const c of getClients()) {
    const hay = [c.name, c.company, c.contactPerson, c.phone, c.email]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) continue;
    pushCapped(
      hits,
      {
        id: c.id,
        label: c.name,
        detail: c.segment,
        href: `/clients/${c.id}`,
        kind: "client",
      },
      counts
    );
  }

  for (const o of getOrders()) {
    const hay = [o.id, o.clientName, o.projectType, o.location, o.team]
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) continue;
    pushCapped(
      hits,
      {
        id: o.id,
        label: o.id,
        detail: `${o.clientName} · ${o.status}`,
        href: `/orders/${o.id}`,
        kind: "order",
      },
      counts
    );
  }

  for (const p of getProjects()) {
    const hay = [p.id, p.name, p.clientName].join(" ").toLowerCase();
    if (!hay.includes(q)) continue;
    pushCapped(
      hits,
      {
        id: p.id,
        label: p.name,
        detail: p.clientName,
        href: `/projects/${p.id}`,
        kind: "project",
      },
      counts
    );
  }

  for (const person of getPeople()) {
    const hay = [
      person.nameAr,
      person.nameEn,
      person.nickname,
      person.jobTitle,
      person.phone,
      person.email,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) continue;
    pushCapped(
      hits,
      {
        id: person.id,
        label: person.nickname || person.nameEn || person.nameAr,
        detail: person.jobTitle || "Crew",
        href: `/crew/${person.id}`,
        kind: "crew",
      },
      counts
    );
  }

  for (const f of getFiles()) {
    const hay = [f.name, f.type, f.projectId, f.orderId, f.clientId]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) continue;
    pushCapped(
      hits,
      {
        id: f.id,
        label: f.name,
        detail: f.type || "File",
        href: f.orderId
          ? `/orders/${f.orderId}`
          : f.projectId
            ? `/projects/${f.projectId}`
            : f.clientId
              ? `/clients/${f.clientId}`
              : "/projects",
        kind: "file",
      },
      counts
    );
  }

  for (const inv of getInvoices()) {
    const hay = [inv.number, inv.clientId, inv.orderId, inv.status]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) continue;
    pushCapped(
      hits,
      {
        id: inv.id,
        label: inv.number,
        detail: `${inv.status} · ${inv.amount}`,
        href: inv.clientId ? `/clients/${inv.clientId}` : "/finance",
        kind: "invoice",
      },
      counts
    );
  }

  for (const pay of getPayments()) {
    const hay = [
      pay.id,
      pay.orderId,
      pay.clientId,
      pay.reference,
      pay.label,
      pay.method,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) continue;
    pushCapped(
      hits,
      {
        id: pay.id,
        label: pay.label || pay.id,
        detail: `${pay.kind} · ${pay.amount} · ${pay.status}`,
        href: pay.orderId
          ? `/orders/${pay.orderId}`
          : pay.clientId
            ? `/clients/${pay.clientId}`
            : "/finance",
        kind: "payment",
      },
      counts
    );
  }

  return hits.slice(0, 16);
}

export const SEARCH_KIND_LABEL: Record<SearchHitKind, string> = {
  quotation: "Quote",
  client: "Client",
  order: "Order",
  project: "Project",
  crew: "Crew",
  file: "File",
  invoice: "Invoice",
  payment: "Payment",
};
