import { mockClients } from "@/lib/clients/mock-data";
import type { Client } from "@/lib/clients/types";

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
