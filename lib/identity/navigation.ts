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
      return `/crew/${entity.id}`;
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
  if (p.personId) return `/crew/${p.personId}`;
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
  team: "/crew",
  schedule: "/calendar",
  wallet: "/me/wallet",
  notifications: "/notifications",
  statistics: "/statistics",
} as const;

export type DashboardLinkKey = keyof typeof DASHBOARD_LINKS;

export function dashboardHref(key: DashboardLinkKey): string {
  return DASHBOARD_LINKS[key];
}

/** Breadcrumb crumb. */
export type Crumb = { label: string; href?: string };

export function crumbsForPath(pathname: string): Crumb[] {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [{ label: "نظرة سريعة", href: "/" }];
  if (parts.length === 0) return crumbs;

  let acc = "";
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!;
    acc += `/${part}`;
    const isLast = i === parts.length - 1;
    const label = labelForSegment(part, parts[i - 1]);
    crumbs.push({
      label,
      href: isLast ? undefined : acc,
    });
  }
  return crumbs;
}

function labelForSegment(segment: string, parent?: string): string {
  const known: Record<string, string> = {
    orders: "الأوردرات",
    projects: "المشاريع",
    clients: "العملاء",
    crew: "الفريق",
    people: "الفريق",
    finance: "المالية",
    calendar: "الجدول",
    commercial: "التجاري",
    quotations: "عروض الأسعار",
    equipment: "المعدات",
    statistics: "الإحصائيات",
    settings: "الإعدادات",
    notifications: "التنبيهات",
    me: "مساحتي",
    wallet: "محفظتي",
    bonus: "البونص",
    target: "التارجيت",
    penalties: "الجزاءات",
    files: "ملفاتي",
    briefs: "البريفز",
    "dress-code": "الدريس كود",
    performance: "أدائي",
    weddings: "الأفراح",
    about: "عن صودا",
    login: "تسجيل الدخول",
    password: "كلمة السر",
    new: "جديد",
  };
  if (known[segment]) return known[segment];
  if (parent === "orders") return "Order";
  if (parent === "projects") return "Project";
  if (parent === "clients") return "Client";
  if (parent === "crew" || parent === "people") return "Member";
  if (parent === "quotations") return "Quotation";
  return segment;
}
