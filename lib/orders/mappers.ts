import type { Order, OrderStatus, ProjectType } from "@/lib/orders/types";

export type OrderRow = {
  id: string;
  project_id: string;
  client_id: string | null;
  client_name: string;
  phone: string;
  project_type: string;
  workspace_id: string;
  subcategory_id: string | null;
  shoot_date: string | null;
  location: string;
  delivery_date: string | null;
  price: number | string;
  deposit: number | string;
  team: string;
  status: string;
  notes: string;
  created_at?: string;
  updated_at?: string;
};

export function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    projectId: row.project_id,
    ...(row.client_id ? { clientId: row.client_id } : {}),
    clientName: row.client_name,
    phone: row.phone ?? "",
    projectType: row.project_type as ProjectType,
    workspaceId: row.workspace_id,
    ...(row.subcategory_id ? { subcategoryId: row.subcategory_id } : {}),
    shootDate: row.shoot_date ?? "",
    location: row.location ?? "",
    deliveryDate: row.delivery_date ?? "",
    price: Number(row.price) || 0,
    deposit: Number(row.deposit) || 0,
    team: row.team ?? "",
    status: row.status as OrderStatus,
    notes: row.notes ?? "",
  };
}

export function orderToRow(order: Order): Record<string, unknown> {
  return {
    id: order.id,
    project_id: order.projectId,
    client_id: order.clientId ?? null,
    client_name: order.clientName,
    phone: order.phone ?? "",
    project_type: order.projectType,
    workspace_id: order.workspaceId,
    subcategory_id: order.subcategoryId ?? null,
    shoot_date: order.shootDate || null,
    location: order.location ?? "",
    delivery_date: order.deliveryDate || null,
    price: order.price,
    deposit: order.deposit,
    team: order.team ?? "",
    status: order.status,
    notes: order.notes ?? "",
  };
}
