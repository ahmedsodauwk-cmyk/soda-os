import type { Order } from "@/lib/orders/types";

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
  statusFilter: string
): Order[] {
  const query = search.trim().toLowerCase();

  return orders.filter((order) => {
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    if (!matchesStatus) return false;
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
