import type { ClientComputedStats } from "@/lib/business/types";
import type { Order } from "@/lib/orders/types";
import type { Payment } from "@/lib/payments/types";
import type { Project } from "@/lib/projects/types";

/**
 * Pure client stats from provided collections.
 * Business Core profile aggregator (getClientProfileStats) is the
 * event-driven source for richer monthly/yearly/LTV fields.
 */
export function computeClientStats(
  clientId: string,
  projects: Project[],
  orders: Order[],
  payments: Payment[]
): ClientComputedStats {
  const clientProjects = projects.filter(
    (p) => p.clientId === clientId && p.isActive
  );
  const projectIds = new Set(clientProjects.map((p) => p.id));
  const clientOrders = orders.filter(
    (o) =>
      o.clientId === clientId ||
      (o.projectId && projectIds.has(o.projectId))
  );

  const activeProjects = clientProjects.filter(
    (p) => p.status === "Active" || p.status === "OnHold"
  ).length;

  const revenue = clientOrders
    .filter(
      (o) =>
        o.status !== "Cancelled" &&
        o.status !== "Holding" &&
        o.status !== "Pending"
    )
    .reduce((acc, o) => acc + o.price, 0);

  const paid = payments
    .filter(
      (p) =>
        p.clientId === clientId &&
        p.status === "paid" &&
        p.kind !== "refund"
    )
    .reduce((acc, p) => acc + p.amount, 0);

  const refunds = payments
    .filter(
      (p) =>
        p.clientId === clientId && p.kind === "refund" && p.status === "paid"
    )
    .reduce((acc, p) => acc + p.amount, 0);

  const lastProject =
    [...clientProjects].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    )[0] ?? null;

  return {
    activeProjects,
    totalOrders: clientOrders.length,
    revenue,
    lastProject: lastProject
      ? {
          id: lastProject.id,
          name: lastProject.name,
          updatedAt: lastProject.updatedAt,
          status: lastProject.status,
        }
      : null,
    outstandingBalance: Math.max(0, revenue - paid + refunds),
  };
}
