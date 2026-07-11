import { ensureOrderProjectLink } from "@/lib/business/link-order";
import { mockOrders } from "@/lib/orders/mock-data";
import type { NewOrderInput, Order } from "@/lib/orders/types";
import {
  generateOrderId,
  workspaceIdFromProjectType,
} from "@/lib/orders/utils";

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

/**
 * Persist a new order into the shared mock store and link Project (+ Client).
 * Callers that need a deposit ledger entry should emit via integration after create.
 */
export function createOrder(input: NewOrderInput): Order {
  const orderId = generateOrderId(mockOrders.length);
  const link = ensureOrderProjectLink(orderId, input);
  const workspaceId =
    link.workspaceId ||
    input.workspaceId ||
    workspaceIdFromProjectType(input.projectType);

  const order: Order = {
    id: orderId,
    clientName: input.clientName,
    phone: input.phone,
    projectType: input.projectType,
    subcategoryId: input.subcategoryId,
    shootDate: input.shootDate,
    location: input.location,
    deliveryDate: input.deliveryDate,
    price: input.price,
    deposit: input.deposit,
    team: input.team,
    status: input.status,
    notes: input.notes,
    projectId: link.projectId!,
    clientId: link.clientId,
    workspaceId,
  };

  mockOrders.unshift(order);
  return { ...order };
}
