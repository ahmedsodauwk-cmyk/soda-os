/**
 * Navigation engine — every surface links to the next logical page.
 * No display-only dead ends for entity ids / financial summaries.
 */

import type { BusinessEntityType, BusinessEvent } from "@/lib/core/types";

export type NavEntity =
  | { type: "order"; id: string }
  | { type: "client"; id: string }
  | { type: "project"; id: string }
  | { type: "person" | "crew"; id: string }
  | { type: "invoice"; id?: string }
  | { type: "payment"; id?: string; orderId?: string }
  | { type: "quotation"; id: string }
  | { type: "equipment"; id?: string }
  | { type: "finance" }
  | { type: "calendar" }
  | { type: "notifications" }
  | { type: "wallet"; personId?: string }
  | { type: "assignments"; orderId: string };

/** Resolve a stable in-app href for an entity. Never returns a broken path. */
export function hrefForEntity(entity: NavEntity): string {
  switch (entity.type) {
    case "order":
      return `/orders/${entity.id}`;
    case "client":
      return `/clients/${entity.id}`;
    case "project":
      return `/projects/${entity.id}`;
    case "person":
    case "crew":
      return `/people/${entity.id}`;
    case "invoice":
    case "payment":
    case "finance":
      if (entity.type === "payment" && entity.orderId) {
        return `/orders/${entity.orderId}`;
      }
      return "/finance";
    case "quotation":
      return `/quotations/${entity.id}`;
    case "equipment":
      return entity.id ? `/equipment` : "/equipment";
    case "calendar":
      return "/calendar";
    case "notifications":
      return "/notifications";
    case "wallet":
      return entity.personId ? `/me/wallet` : "/me/wallet";
    case "assignments":
      return `/orders/${entity.orderId}`;
    default:
      return "/";
  }
}

export function hrefForBusinessEntity(
  entityType: BusinessEntityType,
  entityId: string,
  extras?: { orderId?: string; clientId?: string; projectId?: string }
): string {
  switch (entityType) {
    case "order":
      return hrefForEntity({ type: "order", id: entityId });
    case "client":
      return hrefForEntity({ type: "client", id: entityId });
    case "project":
      return hrefForEntity({ type: "project", id: entityId });
    case "person":
      return hrefForEntity({ type: "crew", id: entityId });
    case "invoice":
      return hrefForEntity({ type: "finance" });
    case "payment":
      return extras?.orderId
        ? hrefForEntity({ type: "order", id: extras.orderId })
        : hrefForEntity({ type: "finance" });
    case "quotation":
      return hrefForEntity({ type: "quotation", id: entityId });
    case "equipment":
      return hrefForEntity({ type: "equipment" });
    case "assignment":
      return extras?.orderId
        ? hrefForEntity({ type: "order", id: extras.orderId })
        : "/orders";
    default:
      if (extras?.orderId) return `/orders/${extras.orderId}`;
      if (extras?.clientId) return `/clients/${extras.clientId}`;
      if (extras?.projectId) return `/projects/${extras.projectId}`;
      return "/notifications";
  }
}

/** Notification / event → never an error page. */
export function hrefForBusinessEvent(event: BusinessEvent): string {
  const p = event.payload;
  if (p.orderId) return `/orders/${p.orderId}`;
  if (p.clientId) return `/clients/${p.clientId}`;
  if (p.projectId) return `/projects/${p.projectId}`;
  if (p.personId) return `/people/${p.personId}`;
  if (p.invoiceId) return "/finance";
  if (p.quotationId) return `/quotations/${p.quotationId}`;

  const financeTypes = new Set([
    "PaymentReceived",
    "InvoiceCreated",
    "InvoicePaid",
    "CrewPaid",
  ]);
  if (financeTypes.has(event.type)) return "/finance";

  const calendarTypes = new Set(["OrderRescheduled", "OrderConfirmed"]);
  if (calendarTypes.has(event.type)) {
    return p.orderId ? `/orders/${p.orderId}` : "/calendar";
  }

  return hrefForBusinessEntity(p.entityType, p.entityId, {
    orderId: p.orderId,
    clientId: p.clientId,
    projectId: p.projectId,
  });
}

/** Dashboard KPI / metric → next logical page. */
export const DASHBOARD_LINKS = {
  revenue: "/finance",
  outstanding: "/finance",
  deposits: "/finance",
  remaining: "/finance",
  collected: "/finance",
  activeProjects: "/projects",
  activeOrders: "/orders",
  upcomingShoots: "/calendar",
  upcomingDeliveries: "/orders",
  activeClients: "/clients",
  team: "/people",
  schedule: "/calendar",
  attention: "/attention",
  wallet: "/me/wallet",
  notifications: "/notifications",
  statistics: "/statistics",
  quotations: "/quotations",
} as const;

export type DashboardLinkKey = keyof typeof DASHBOARD_LINKS;

export function dashboardHref(key: DashboardLinkKey): string {
  return DASHBOARD_LINKS[key];
}

/** Breadcrumb crumb — `labelKey` prefers i18n; `label` is fallback display. */
export type Crumb = { label: string; labelKey?: string; href?: string };

const SEGMENT_CRUMB_KEY: Record<string, string> = {
  orders: "crumbs.orders",
  projects: "crumbs.projects",
  clients: "crumbs.clients",
  crew: "crumbs.crew",
  people: "crumbs.people",
  finance: "crumbs.finance",
  calendar: "crumbs.calendar",
  commercial: "crumbs.commercial",
  quotations: "crumbs.quotations",
  equipment: "crumbs.equipment",
  statistics: "crumbs.statistics",
  settings: "crumbs.settings",
  notifications: "crumbs.notifications",
  attention: "crumbs.attention",
  schedule: "crumbs.schedule",
  me: "crumbs.me",
  wallet: "crumbs.wallet",
  bonus: "crumbs.bonus",
  target: "crumbs.target",
  penalties: "crumbs.penalties",
  files: "crumbs.files",
  briefs: "crumbs.briefs",
  "dress-code": "crumbs.dressCode",
  performance: "crumbs.performance",
  weddings: "crumbs.weddings",
  about: "crumbs.about",
  login: "crumbs.login",
  password: "crumbs.password",
  new: "crumbs.new",
  today: "crumbs.schedule",
  tomorrow: "crumbs.schedule",
  deliveries: "crumbs.schedule",
  deadlines: "crumbs.schedule",
};

export function crumbsForPath(pathname: string): Crumb[] {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [
    { label: "Home Screen", labelKey: "crumbs.home", href: "/" },
  ];
  if (parts.length === 0) return crumbs;

  let acc = "";
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!;
    acc += `/${part}`;
    const isLast = i === parts.length - 1;
    const { label, labelKey } = labelForSegment(part, parts[i - 1]);
    crumbs.push({
      label,
      labelKey,
      href: isLast ? undefined : acc,
    });
  }
  return crumbs;
}

function labelForSegment(
  segment: string,
  parent?: string
): { label: string; labelKey?: string } {
  const key = SEGMENT_CRUMB_KEY[segment];
  if (key) {
    return { label: segment, labelKey: key };
  }
  if (parent === "orders") return { label: "Order", labelKey: "pages.order" };
  if (parent === "projects")
    return { label: "Project", labelKey: "pages.project" };
  if (parent === "clients")
    return { label: "Client", labelKey: "pages.client" };
  if (parent === "crew" || parent === "people")
    return { label: "Member", labelKey: "pages.peopleProfile" };
  if (parent === "quotations")
    return { label: "Quotation", labelKey: "pages.quotation" };
  return { label: segment };
}
