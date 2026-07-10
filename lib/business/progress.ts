import type { Order, OrderStatus } from "@/lib/orders/types";

const ORDER_STATUS_PROGRESS: Record<OrderStatus, number> = {
  Pending: 10,
  Scheduled: 25,
  Shooting: 45,
  Editing: 70,
  Delivered: 100,
  Cancelled: 0,
};

/** Average progress across non-cancelled orders (0–100). */
export function computeProgressFromOrders(orders: Order[]): number {
  const active = orders.filter((o) => o.status !== "Cancelled");
  if (active.length === 0) return 0;

  const sum = active.reduce(
    (acc, o) => acc + ORDER_STATUS_PROGRESS[o.status],
    0
  );
  return Math.round(sum / active.length);
}
