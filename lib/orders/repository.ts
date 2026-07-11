import { ensureOrderProjectLink } from "@/lib/business/link-order";
import { createOrdersDb } from "@/lib/orders/db";
import { orderToRow, rowToOrder, type OrderRow } from "@/lib/orders/mappers";
import type { NewOrderInput, Order } from "@/lib/orders/types";
import {
  generateOrderId,
  workspaceIdFromProjectType,
} from "@/lib/orders/utils";
import { ensureTaxonomyPersisted } from "@/lib/taxonomy/persist";

let ordersCache: Order[] = [];

function setCache(orders: Order[]): Order[] {
  ordersCache = [...orders];
  return ordersCache;
}

function upsertCache(order: Order): void {
  ordersCache = [order, ...ordersCache.filter((o) => o.id !== order.id)];
}

export async function refreshOrders(): Promise<Order[]> {
  await ensureTaxonomyPersisted();
  const db = createOrdersDb();
  const { data, error } = await db
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(`Failed to load orders: ${error.message}`);
  }
  return setCache(((data ?? []) as OrderRow[]).map(rowToOrder));
}

export function getOrders(): Order[] {
  return [...ordersCache];
}

export function getOrderById(id: string): Order | undefined {
  return ordersCache.find((o) => o.id === id);
}

export function getOrdersByProject(projectId: string): Order[] {
  return ordersCache.filter((o) => o.projectId === projectId);
}

export function getOrdersByClient(clientId: string): Order[] {
  return ordersCache.filter((o) => o.clientId === clientId);
}

export function getOrdersByWorkspace(workspaceId: string): Order[] {
  return ordersCache.filter((o) => o.workspaceId === workspaceId);
}

export async function fetchOrderById(
  id: string
): Promise<Order | undefined> {
  const db = createOrdersDb();
  const { data, error } = await db
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load order ${id}: ${error.message}`);
  }
  if (!data) return undefined;
  const order = rowToOrder(data as OrderRow);
  upsertCache(order);
  return order;
}

/**
 * Persist a new order into Supabase and link Project (+ Client).
 */
export async function createOrder(input: NewOrderInput): Promise<Order> {
  await ensureTaxonomyPersisted();
  const orderId = generateOrderId(ordersCache.length);
  const link = await ensureOrderProjectLink(orderId, input);
  const workspaceId =
    link.workspaceId ||
    input.workspaceId ||
    workspaceIdFromProjectType(input.projectType);

  const order: Order = {
    id: orderId,
    projectId: link.projectId!,
    clientId: link.clientId,
    clientName: input.clientName,
    phone: input.phone,
    whatsapp: input.whatsapp ?? "",
    projectType: input.projectType,
    workspaceId,
    subcategoryId: input.subcategoryId,
    shootDate: input.shootDate,
    location: input.location ?? "",
    deliveryDate: input.deliveryDate ?? "",
    price: input.price,
    deposit: input.deposit,
    team: input.team,
    squadMemberIds: input.squadMemberIds ?? [],
    status: input.status,
    brief: input.brief ?? "",
    dressCode: input.dressCode,
    latePenaltyEnabled: input.latePenaltyEnabled ?? false,
    latePenaltyAmount: input.latePenaltyAmount ?? 0,
    latePenaltyReason: input.latePenaltyReason ?? "",
    notes: input.notes ?? "",
  };

  const db = createOrdersDb();
  const { data, error } = await db
    .from("orders")
    .insert(orderToRow(order))
    .select("*")
    .single();
  if (error) {
    throw new Error(`Failed to create order: ${error.message}`);
  }
  const saved = rowToOrder(data as OrderRow);
  upsertCache(saved);
  return { ...saved };
}

export async function updateOrder(
  id: string,
  patch: Partial<Omit<Order, "id">>
): Promise<Order> {
  const existing = getOrderById(id) ?? (await fetchOrderById(id));
  if (!existing) throw new Error(`Order not found: ${id}`);
  const merged: Order = { ...existing, ...patch, id };
  const db = createOrdersDb();
  const row = orderToRow(merged);
  delete row.id;
  const { data, error } = await db
    .from("orders")
    .update(row)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    throw new Error(`Failed to update order: ${error.message}`);
  }
  const saved = rowToOrder(data as OrderRow);
  upsertCache(saved);
  return { ...saved };
}

export async function deleteOrder(id: string): Promise<void> {
  const db = createOrdersDb();
  const { error } = await db.from("orders").delete().eq("id", id);
  if (error) {
    throw new Error(`Failed to delete order: ${error.message}`);
  }
  ordersCache = ordersCache.filter((o) => o.id !== id);
}

export function cacheOrder(order: Order): void {
  upsertCache(order);
}
