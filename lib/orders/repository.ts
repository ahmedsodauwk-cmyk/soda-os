import { mockOrders } from "@/lib/orders/mock-data";
import type { Order } from "@/lib/orders/types";

export function getOrders(): Order[] {
  return [...mockOrders];
}

export function getOrderById(id: string): Order | undefined {
  return mockOrders.find((o) => o.id === id);
}

export function getOrdersByProject(projectId: string): Order[] {
  return mockOrders.filter((o) => o.projectId === projectId);
}

export function getOrdersByClient(clientId: string): Order[] {
  return mockOrders.filter((o) => o.clientId === clientId);
}

export function getOrdersByWorkspace(workspaceId: string): Order[] {
  return mockOrders.filter((o) => o.workspaceId === workspaceId);
}
