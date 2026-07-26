import type { Client } from "@/lib/clients/types";
import type { Order } from "@/lib/orders/types";
import type { Project } from "@/lib/projects/types";
import { getClientById } from "@/lib/clients/repository";
import { getClientOperatingView } from "@/lib/integration/queries";

export interface ClientOrderContext {
  client: Client;
  previousOrders: Order[];
  projects: Project[];
  revenue: number;
  outstanding: number;
  lastShoot: string | null;
  collectionStatus: "clear" | "partial" | "outstanding" | "none";
}

/** Snapshot used by Smart Client autocomplete fill (read-only, client-safe). */
export function getClientOrderContext(
  clientId: string
): ClientOrderContext | null {
  const client = getClientById(clientId);
  if (!client) return null;
  const view = getClientOperatingView(clientId);
  const shoots = view.orders
    .map((o) => o.shootDate)
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));
  const outstanding = view.finance.outstanding;
  const paid = view.finance.paid;
  let collectionStatus: ClientOrderContext["collectionStatus"] = "none";
  if (view.orders.length === 0) collectionStatus = "none";
  else if (outstanding <= 0) collectionStatus = "clear";
  else if (paid > 0) collectionStatus = "partial";
  else collectionStatus = "outstanding";

  return {
    client,
    previousOrders: view.orders,
    projects: view.projects,
    revenue: view.finance.obligatedTotal,
    outstanding,
    lastShoot: shoots[0] ?? null,
    collectionStatus,
  };
}
