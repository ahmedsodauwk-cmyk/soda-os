import { computeClientStats } from "@/lib/business/client-stats";
import type { ClientComputedStats } from "@/lib/business/types";
import { mockClients } from "@/lib/clients/mock-data";
import type { Client } from "@/lib/clients/types";
import { getOrders } from "@/lib/orders/repository";
import { getPayments } from "@/lib/payments/repository";
import { getProjects } from "@/lib/projects/repository";

export function getClients(): Client[] {
  return mockClients.filter((c) => c.isActive);
}

export function getAllClients(): Client[] {
  return [...mockClients];
}

export function getClientById(id: string): Client | undefined {
  return mockClients.find((c) => c.id === id);
}

export function getClientsByType(type: Client["type"]): Client[] {
  return mockClients.filter((c) => c.type === type && c.isActive);
}

export function getOrdersCountByClient(
  clientId: string,
  orderClientIds: string[]
): number {
  return orderClientIds.filter((id) => id === clientId).length;
}

export function getClientStats(clientId: string): ClientComputedStats {
  return computeClientStats(
    clientId,
    getProjects(),
    getOrders(),
    getPayments()
  );
}

export function getClientsWithStats(): Array<Client & ClientComputedStats> {
  return getAllClients().map((client) => ({
    ...client,
    ...getClientStats(client.id),
  }));
}

export function getProjectCountByClient(clientId: string): number {
  return getProjects().filter((p) => p.clientId === clientId).length;
}
