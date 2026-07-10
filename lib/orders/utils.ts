import type { Order, ProjectType } from "@/lib/orders/types";

/** UI tab order for workspace filters (All is handled separately). */
export const WORKSPACE_TAB_ORDER = [
  "rtm",
  "weddings",
  "commercial",
  "fashion",
  "product",
  "events",
] as const;

/** Default workspace when creating an order from legacy project type. */
export function workspaceIdFromProjectType(projectType: ProjectType): string {
  switch (projectType) {
    case "Wedding":
    case "Engagement":
      return "weddings";
    case "Commercial":
      return "commercial";
    case "Portrait":
      return "fashion";
    case "Event":
      return "events";
    case "Product":
      return "product";
    default:
      return "commercial";
  }
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function generateOrderId(existingCount: number): string {
  const next = existingCount + 1;
  return `SODA-2026-${String(next).padStart(4, "0")}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function filterOrders(
  orders: Order[],
  search: string,
  statusFilter: string,
  workspaceFilter: string = "all",
  subcategoryFilter: string | null = null
): Order[] {
  const query = search.trim().toLowerCase();

  return orders.filter((order) => {
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    if (!matchesStatus) return false;

    const matchesWorkspace =
      workspaceFilter === "all" || order.workspaceId === workspaceFilter;

    if (!matchesWorkspace) return false;

    if (subcategoryFilter && order.subcategoryId !== subcategoryFilter) {
      return false;
    }

    if (!query) return true;

    const searchable = [
      order.id,
      order.clientName,
      order.phone,
      order.projectType,
      order.team,
      order.location,
      order.status,
    ]
      .join(" ")
      .toLowerCase();

    return searchable.includes(query);
  });
}
