/**
 * Client Workspace aggregators — Source of Truth for section data (Mission 04.2).
 * Composes existing repos; does not invent partnership share % or fake history.
 */

import { computeClientStats } from "@/lib/business/client-stats";
import { listBusinessEvents, type BusinessEvent } from "@/lib/core";
import { listExpenses, type Expense } from "@/lib/finance/expenses";
import { getFiles, getFilesByClient } from "@/lib/files/repository";
import type { FileAsset } from "@/lib/files/types";
import { getClientOperatingView } from "@/lib/integration";
import {
  getDeliveriesByClient,
  getInvoicesByClient,
} from "@/lib/invoices/repository";
import type { Invoice } from "@/lib/invoices/types";
import { getOrders } from "@/lib/orders/repository";
import type { Order } from "@/lib/orders/types";
import { getPayments, getPaymentsByClient } from "@/lib/payments/repository";
import type { Payment } from "@/lib/payments/types";
import { getProjects, getProjectsByClient } from "@/lib/projects/repository";
import type { Project } from "@/lib/projects/types";
import {
  CLIENT_BUSINESS_ROLE_LABELS,
  resolveOrderClientBelonging,
  type OrderClientBelonging,
} from "@/lib/clients/workspace";
import { getClientById } from "@/lib/clients/repository";
import type { Client, ClientBusinessRole } from "@/lib/clients/types";

export type RelationshipHealth = "healthy" | "attention" | "risk" | "unknown";

export interface ClientWorkspaceOverview {
  client: Client;
  roleLabel: string;
  health: RelationshipHealth;
  healthReason: string;
  currentBalance: number;
  outstanding: number;
  collected: number;
  lastActivityAt: string | null;
  lastPayment: Payment | null;
  lastOrder: Order | null;
  openOrders: number;
  activeProjects: number;
  orderCount: number;
  projectCount: number;
}

export interface DailyWorkMonthGroup {
  monthKey: string; // YYYY-MM
  label: string;
  orders: Order[];
  orderCount: number;
  totalPrice: number;
}

export interface DailyWorkYearGroup {
  year: string;
  months: DailyWorkMonthGroup[];
  orderCount: number;
}

export interface ClientDailyWorkView {
  clientId: string;
  years: DailyWorkYearGroup[];
  orderCount: number;
  /** Honest note when belonging is inferred / empty */
  belongingNote: string;
}

export interface ClientProjectWorkspaceItem {
  project: Project;
  orders: Order[];
  collected: number;
  outstanding: number;
}

export interface ClientProjectsWorkspaceView {
  clientId: string;
  projects: ClientProjectWorkspaceItem[];
  /** Includes closed/inactive — financial history never drops projects */
  closedCount: number;
}

export interface PaymentMethodBreakdown {
  method: string;
  count: number;
  amount: number;
}

export interface ClientFinancialHistoryView {
  clientId: string;
  collected: number;
  outstanding: number;
  obligated: number;
  expenses: number;
  profit: number | null;
  invoices: Invoice[];
  payments: Payment[];
  expenseLines: Expense[];
  methods: PaymentMethodBreakdown[];
  currency: "EGP";
}

export interface PartnershipHistoryRow {
  projectId: string;
  projectName: string;
  projectStatus: string;
  sharePercent: number | null;
  revenue: number;
  expenses: number;
  netShare: number | null;
  settlementStatus: "not_recorded" | "open" | "settled";
}

export interface ClientPartnershipHistoryView {
  clientId: string;
  isPartner: boolean;
  role: ClientBusinessRole;
  rows: PartnershipHistoryRow[];
  emptyReason: string | null;
}

export type ClientTimelineKind =
  | "client_created"
  | "order"
  | "payment"
  | "project_started"
  | "project_closed"
  | "invoice"
  | "partnership"
  | "business_event";

export interface ClientTimelineItem {
  id: string;
  at: string;
  kind: ClientTimelineKind;
  title: string;
  detail?: string;
  href?: string;
}

export interface ClientTimelineView {
  clientId: string;
  items: ClientTimelineItem[];
}

export interface ClientFilesWorkspaceView {
  clientId: string;
  files: FileAsset[];
}

export interface ClientNotesView {
  clientId: string;
  notes: string;
  updatedHint: string | null;
}

export interface ClientContactPerson {
  name: string;
  role: string;
  phone?: string;
  email?: string;
  source: "primary" | "contacts";
}

export interface ClientContactsView {
  clientId: string;
  people: ClientContactPerson[];
  channels: {
    phone: string;
    whatsapp?: string;
    email?: string;
  };
}

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function orderBelonging(order: Order): OrderClientBelonging {
  return resolveOrderClientBelonging({
    projectId: order.projectId,
    subcategoryId: order.subcategoryId,
  });
}

function clientOrders(clientId: string): Order[] {
  const projects = getProjectsByClient(clientId);
  const projectIds = new Set(projects.map((p) => p.id));
  return getOrders().filter(
    (o) =>
      o.clientId === clientId ||
      (o.projectId != null && projectIds.has(o.projectId))
  );
}

function paidPayments(clientId: string): Payment[] {
  return getPaymentsByClient(clientId)
    .filter((p) => p.status === "paid" && p.kind !== "refund")
    .sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? ""));
}

function deriveHealth(input: {
  outstanding: number;
  obligated: number;
  lastActivityAt: string | null;
  orderCount: number;
}): { health: RelationshipHealth; reason: string } {
  const { outstanding, obligated, lastActivityAt, orderCount } = input;
  if (orderCount === 0 && obligated === 0) {
    return { health: "unknown", reason: "No orders yet — relationship just opening" };
  }
  const ratio = obligated > 0 ? outstanding / obligated : 0;
  const daysSince = lastActivityAt
    ? Math.floor(
        (Date.now() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  if (ratio >= 0.5 && outstanding > 0) {
    return {
      health: "risk",
      reason: "High outstanding relative to obligated work",
    };
  }
  if (outstanding > 0 || (daysSince != null && daysSince > 90)) {
    return {
      health: "attention",
      reason:
        outstanding > 0
          ? "Balance still open"
          : "Quiet for 90+ days — check in",
    };
  }
  return { health: "healthy", reason: "Current and active" };
}

export function getClientWorkspaceOverview(
  clientId: string
): ClientWorkspaceOverview | null {
  const client = getClientById(clientId);
  if (!client) return null;

  const view = getClientOperatingView(clientId);
  const stats = computeClientStats(
    clientId,
    getProjects(),
    getOrders(),
    getPayments()
  );
  const payments = paidPayments(clientId);
  const orders = [...view.orders].sort((a, b) =>
    (b.shootDate || b.deliveryDate || "").localeCompare(
      a.shootDate || a.deliveryDate || ""
    )
  );
  const lastPayment = payments[0] ?? null;
  const lastOrder = orders[0] ?? null;

  const activityCandidates = [
    client.createdAt,
    lastPayment?.paidAt,
    lastOrder?.shootDate,
    lastOrder?.deliveryDate,
    ...view.projects.map((p) => p.updatedAt),
  ].filter((v): v is string => Boolean(v));
  activityCandidates.sort((a, b) => b.localeCompare(a));
  const lastActivityAt = activityCandidates[0] ?? null;

  const collected = view.finance.paid;
  const outstanding =
    view.finance.events.length > 0
      ? view.finance.outstanding
      : stats.outstandingBalance;
  const { health, reason } = deriveHealth({
    outstanding,
    obligated: view.finance.obligatedTotal,
    lastActivityAt,
    orderCount: view.orders.length,
  });

  return {
    client,
    roleLabel: CLIENT_BUSINESS_ROLE_LABELS[client.businessRole],
    health,
    healthReason: reason,
    currentBalance: view.finance.obligatedTotal,
    outstanding,
    collected,
    lastActivityAt,
    lastPayment,
    lastOrder,
    openOrders: view.orders.filter(
      (o) =>
        o.status !== "Completed" &&
        o.status !== "Cancelled" &&
        o.status !== "Delivered"
    ).length,
    activeProjects: stats.activeProjects,
    orderCount: view.orders.length,
    projectCount: view.projects.length,
  };
}

export function getClientDailyWork(clientId: string): ClientDailyWorkView {
  const orders = clientOrders(clientId).filter(
    (o) => orderBelonging(o) === "daily_work"
  );

  const byYear = new Map<string, Map<string, Order[]>>();
  for (const order of orders) {
    const dateKey = order.shootDate?.slice(0, 7) || "unknown";
    const year = dateKey.slice(0, 4);
    const monthKey = dateKey.length >= 7 ? dateKey : `${year}-01`;
    if (!byYear.has(year)) byYear.set(year, new Map());
    const months = byYear.get(year)!;
    if (!months.has(monthKey)) months.set(monthKey, []);
    months.get(monthKey)!.push(order);
  }

  const years: DailyWorkYearGroup[] = [...byYear.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, months]) => {
      const monthGroups: DailyWorkMonthGroup[] = [...months.entries()]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([monthKey, monthOrders]) => {
          const monthIdx = Number(monthKey.slice(5, 7)) - 1;
          const label =
            monthIdx >= 0 && monthIdx < 12
              ? `${MONTH_LABELS[monthIdx]} ${year}`
              : monthKey;
          const sorted = [...monthOrders].sort((a, b) =>
            (b.shootDate || "").localeCompare(a.shootDate || "")
          );
          return {
            monthKey,
            label,
            orders: sorted,
            orderCount: sorted.length,
            totalPrice: sorted
              .filter((o) => o.status !== "Cancelled")
              .reduce((s, o) => s + o.price, 0),
          };
        });
      return {
        year,
        months: monthGroups,
        orderCount: monthGroups.reduce((s, m) => s + m.orderCount, 0),
      };
    });

  return {
    clientId,
    years,
    orderCount: orders.length,
    belongingNote:
      orders.length === 0
        ? "No daily work recorded yet. When the Founder links orders here (outside a named Project), they will appear by year and month. Nothing is invented."
        : "Orders classified as daily work (no project link, or daily-work subcategory).",
  };
}

export function getClientProjectsWorkspace(
  clientId: string
): ClientProjectsWorkspaceView {
  const projects = getProjectsByClient(clientId).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
  const payments = getPaymentsByClient(clientId);

  const items: ClientProjectWorkspaceItem[] = projects.map((project) => {
    const orders = getOrders().filter((o) => o.projectId === project.id);
    const projectPayments = payments.filter(
      (p) => p.projectId === project.id && p.status === "paid" && p.kind !== "refund"
    );
    const collected = projectPayments.reduce((s, p) => s + p.amount, 0);
    const obligated = orders
      .filter((o) => o.status !== "Cancelled" && o.status !== "Holding")
      .reduce((s, o) => s + o.price, 0);
    return {
      project,
      orders: orders.sort((a, b) =>
        (b.shootDate || "").localeCompare(a.shootDate || "")
      ),
      collected,
      outstanding: Math.max(0, obligated - collected),
    };
  });

  return {
    clientId,
    projects: items,
    closedCount: projects.filter(
      (p) => p.status === "Completed" || p.status === "Cancelled" || !p.isActive
    ).length,
  };
}

export function getClientFinancialHistory(
  clientId: string
): ClientFinancialHistoryView {
  const view = getClientOperatingView(clientId);
  const invoices = getInvoicesByClient(clientId);
  const payments = getPaymentsByClient(clientId).sort((a, b) =>
    (b.paidAt ?? "").localeCompare(a.paidAt ?? "")
  );
  const orderIds = new Set(view.orders.map((o) => o.id));
  const expenseLines = listExpenses().filter(
    (e) =>
      e.status === "posted" && e.orderId != null && orderIds.has(e.orderId)
  );
  const expenses = expenseLines.reduce((s, e) => s + e.amount, 0);
  const collected = view.finance.paid;
  const outstanding = view.finance.outstanding;
  const obligated = view.finance.obligatedTotal;

  const methodMap = new Map<string, PaymentMethodBreakdown>();
  for (const p of payments.filter((x) => x.status === "paid")) {
    const method = p.method ?? "not recorded";
    const prev = methodMap.get(method) ?? { method, count: 0, amount: 0 };
    prev.count += 1;
    prev.amount += p.amount;
    methodMap.set(method, prev);
  }

  const profit =
    expenseLines.length > 0 || collected > 0
      ? collected - expenses
      : null;

  return {
    clientId,
    collected,
    outstanding,
    obligated,
    expenses,
    profit,
    invoices,
    payments,
    expenseLines,
    methods: [...methodMap.values()].sort((a, b) => b.amount - a.amount),
    currency: "EGP",
  };
}

export function getClientPartnershipHistory(
  clientId: string
): ClientPartnershipHistoryView {
  const client = getClientById(clientId);
  if (!client) {
    return {
      clientId,
      isPartner: false,
      role: "client",
      rows: [],
      emptyReason: "Client not found",
    };
  }

  const isPartner =
    client.businessRole === "partner" || client.businessRole === "both";

  if (!isPartner) {
    return {
      clientId,
      isPartner: false,
      role: client.businessRole,
      rows: [],
      emptyReason:
        "Partnership History is ready for this relationship. Mark the business role as Partner or Client + Partner when that is true — no partnership work is invented here.",
    };
  }

  const projects = getProjectsByClient(clientId);
  const finance = getClientFinancialHistory(clientId);
  const expensesByOrder = new Map(
    finance.expenseLines.map((e) => [e.orderId!, e.amount])
  );

  // Share % / settlement are not in schema — structure only, honest empty numbers.
  const rows: PartnershipHistoryRow[] = projects.map((project) => {
    const projectOrders = getOrders().filter((o) => o.projectId === project.id);
    const revenue = projectOrders
      .filter((o) => o.status !== "Cancelled")
      .reduce((s, o) => s + o.price, 0);
    const expenses = projectOrders.reduce(
      (s, o) => s + (expensesByOrder.get(o.id) ?? 0),
      0
    );
    return {
      projectId: project.id,
      projectName: project.name,
      projectStatus: project.status,
      sharePercent: null,
      revenue,
      expenses,
      netShare: null,
      settlementStatus: "not_recorded",
    };
  });

  return {
    clientId,
    isPartner: true,
    role: client.businessRole,
    rows,
    emptyReason:
      rows.length === 0
        ? "Partner role is set, but no shared projects yet. Share % and settlement stay empty until the Founder records them."
        : "Partner projects listed. Share % and settlement status are not recorded in the database yet — never invented.",
  };
}

function timelineFromEntities(clientId: string): ClientTimelineItem[] {
  const client = getClientById(clientId);
  if (!client) return [];
  const items: ClientTimelineItem[] = [];

  items.push({
    id: `client-created-${client.id}`,
    at: client.createdAt,
    kind: "client_created",
    title: "Client relationship opened",
    detail: `${client.name} · ${CLIENT_BUSINESS_ROLE_LABELS[client.businessRole]}`,
    href: `/clients/${clientId}`,
  });

  for (const project of getProjectsByClient(clientId)) {
    items.push({
      id: `project-start-${project.id}`,
      at: project.createdAt,
      kind: "project_started",
      title: "Project started",
      detail: project.name,
      href: `/projects/${project.id}`,
    });
    if (project.status === "Completed" || project.status === "Cancelled") {
      items.push({
        id: `project-close-${project.id}`,
        at: project.updatedAt,
        kind: "project_closed",
        title:
          project.status === "Completed" ? "Project closed" : "Project cancelled",
        detail: project.name,
        href: `/projects/${project.id}`,
      });
    }
  }

  const orders = clientOrders(clientId).sort((a, b) =>
    a.shootDate.localeCompare(b.shootDate)
  );
  orders.forEach((order, index) => {
    items.push({
      id: `order-${order.id}`,
      at: order.shootDate,
      kind: "order",
      title: index === 0 ? "First order" : "Order",
      detail: `${order.id} · ${order.status} · ${order.shootDate}`,
      href: `/orders/${order.id}`,
    });
  });

  for (const payment of paidPayments(clientId)) {
    if (!payment.paidAt) continue;
    items.push({
      id: `payment-${payment.id}`,
      at: payment.paidAt,
      kind: "payment",
      title: "Payment received",
      detail: `${payment.amount.toLocaleString("en-EG")} EGP · ${payment.kind}${
        payment.method ? ` · ${payment.method}` : ""
      }`,
      href: payment.orderId ? `/orders/${payment.orderId}` : undefined,
    });
  }

  for (const inv of getInvoicesByClient(clientId)) {
    items.push({
      id: `invoice-${inv.id}`,
      at: inv.issueDate || inv.dueDate,
      kind: "invoice",
      title: "Invoice",
      detail: `${inv.number} · ${inv.status} · ${inv.amount.toLocaleString("en-EG")} EGP`,
      href: "/finance",
    });
  }

  return items.filter((i) => Boolean(i.at));
}

function timelineFromEvents(clientId: string): ClientTimelineItem[] {
  const events = listBusinessEvents(200).filter(
    (e) =>
      e.payload.clientId === clientId ||
      (e.payload.entityType === "client" && e.payload.entityId === clientId)
  );

  return events.map((e: BusinessEvent) => ({
    id: `evt-${e.id}`,
    at: e.occurredAt,
    kind: "business_event" as const,
    title: e.payload.summary || e.type,
    detail: e.source,
    href:
      e.payload.orderId
        ? `/orders/${e.payload.orderId}`
        : e.payload.projectId
          ? `/projects/${e.payload.projectId}`
          : undefined,
  }));
}

export function getClientTimeline(clientId: string): ClientTimelineView {
  const fromEntities = timelineFromEntities(clientId);
  const fromEvents = timelineFromEvents(clientId);

  // Prefer entity-derived milestones; merge unique event ids
  const seen = new Set(fromEntities.map((i) => `${i.kind}:${i.at}:${i.title}`));
  const merged = [...fromEntities];
  for (const item of fromEvents) {
    const key = `${item.kind}:${item.at}:${item.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  merged.sort((a, b) => b.at.localeCompare(a.at));

  return { clientId, items: merged };
}

export function getClientFilesWorkspace(
  clientId: string
): ClientFilesWorkspaceView {
  const byClientId = getFilesByClient(clientId);
  const projectIds = new Set(getProjectsByClient(clientId).map((p) => p.id));
  const byProject = getFiles().filter(
    (f) => projectIds.has(f.projectId) && f.clientId !== clientId
  );
  const map = new Map<string, FileAsset>();
  for (const f of [...byClientId, ...byProject]) {
    map.set(f.id, f);
  }
  const files = [...map.values()].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
  return { clientId, files };
}

export function getClientNotes(clientId: string): ClientNotesView | null {
  const client = getClientById(clientId);
  if (!client) return null;
  return {
    clientId,
    notes: client.notes?.trim() ?? "",
    updatedHint: null,
  };
}

export function getClientContacts(clientId: string): ClientContactsView | null {
  const client = getClientById(clientId);
  if (!client) return null;

  const people: ClientContactPerson[] = [];
  if (client.contactPerson?.trim()) {
    people.push({
      name: client.contactPerson.trim(),
      role: "Primary contact",
      phone: client.phone,
      email: client.email,
      source: "primary",
    });
  }
  for (const c of client.contacts ?? []) {
    if (!c.name?.trim()) continue;
    people.push({
      name: c.name.trim(),
      role: c.role?.trim() || "Contact",
      phone: c.phone,
      email: c.email,
      source: "contacts",
    });
  }

  // Individual clients: surface the person themselves when no contactPerson
  if (people.length === 0 && client.type === "individual") {
    people.push({
      name: client.name,
      role: "Client",
      phone: client.phone,
      email: client.email,
      source: "primary",
    });
  }

  return {
    clientId,
    people,
    channels: {
      phone: client.phone,
      ...(client.whatsapp ? { whatsapp: client.whatsapp } : {}),
      ...(client.email ? { email: client.email } : {}),
    },
  };
}

/** Keep deliveries available for overview deep context without exporting unused. */
export function getClientDeliveryCount(clientId: string): number {
  return getDeliveriesByClient(clientId).length;
}
