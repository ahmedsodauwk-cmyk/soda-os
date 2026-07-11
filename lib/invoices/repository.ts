import { createInvoicesDb } from "@/lib/invoices/db";
import {
  deliveryToRow,
  invoiceToRow,
  rowToDelivery,
  rowToInvoice,
  type DeliveryRow,
  type InvoiceRow,
} from "@/lib/invoices/mappers";
import type { Invoice, OrderDelivery } from "@/lib/invoices/types";
import { invoiceOutstanding } from "@/lib/invoices/types";

let invoicesCache: Invoice[] = [];
let deliveriesCache: OrderDelivery[] = [];

function upsertInvoice(inv: Invoice): void {
  invoicesCache = [inv, ...invoicesCache.filter((i) => i.id !== inv.id)];
}

function upsertDelivery(d: OrderDelivery): void {
  deliveriesCache = [d, ...deliveriesCache.filter((x) => x.id !== d.id)];
}

export async function refreshInvoices(): Promise<Invoice[]> {
  const db = createInvoicesDb();
  const [inv, del] = await Promise.all([
    db.from("invoices").select("*").order("issue_date", { ascending: false }),
    db.from("deliveries").select("*").order("due_date", { ascending: false }),
  ]);
  if (inv.error) {
    throw new Error(`Failed to load invoices: ${inv.error.message}`);
  }
  if (del.error) {
    throw new Error(`Failed to load deliveries: ${del.error.message}`);
  }
  invoicesCache = ((inv.data ?? []) as InvoiceRow[]).map(rowToInvoice);
  deliveriesCache = ((del.data ?? []) as DeliveryRow[]).map(rowToDelivery);
  return [...invoicesCache];
}

export function getDeliveries(): OrderDelivery[] {
  return [...deliveriesCache];
}

export function getDeliveriesByClient(clientId: string): OrderDelivery[] {
  return deliveriesCache.filter((d) => d.clientId === clientId);
}

export function getDeliveriesByOrder(orderId: string): OrderDelivery[] {
  return deliveriesCache.filter((d) => d.orderId === orderId);
}

export function getInvoices(): Invoice[] {
  return [...invoicesCache];
}

export function getInvoicesByClient(clientId: string): Invoice[] {
  return invoicesCache.filter((i) => i.clientId === clientId);
}

export function getInvoicesByPeriod(
  clientId: string,
  periodMonth: string
): Invoice[] {
  return invoicesCache.filter(
    (i) => i.clientId === clientId && i.periodMonth === periodMonth
  );
}

export function getClientInvoiceOutstanding(clientId: string): number {
  return getInvoicesByClient(clientId).reduce(
    (acc, inv) => acc + invoiceOutstanding(inv),
    0
  );
}

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}`;
}

export async function createInvoice(
  input: Omit<Invoice, "id"> & { id?: string }
): Promise<Invoice> {
  const invoice: Invoice = { ...input, id: input.id ?? newId("inv") };
  const db = createInvoicesDb();
  const { data, error } = await db
    .from("invoices")
    .insert(invoiceToRow(invoice))
    .select("*")
    .single();
  if (error) {
    throw new Error(`Failed to create invoice: ${error.message}`);
  }
  const saved = rowToInvoice(data as InvoiceRow);
  upsertInvoice(saved);
  return { ...saved };
}

export async function updateInvoice(
  id: string,
  patch: Partial<Omit<Invoice, "id">>
): Promise<Invoice> {
  const existing = invoicesCache.find((i) => i.id === id);
  if (!existing) throw new Error(`Invoice not found: ${id}`);
  const merged: Invoice = { ...existing, ...patch, id };
  const db = createInvoicesDb();
  const row = invoiceToRow(merged);
  delete row.id;
  const { data, error } = await db
    .from("invoices")
    .update(row)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    throw new Error(`Failed to update invoice: ${error.message}`);
  }
  const saved = rowToInvoice(data as InvoiceRow);
  upsertInvoice(saved);
  return { ...saved };
}

export async function deleteInvoice(id: string): Promise<void> {
  const db = createInvoicesDb();
  const { error } = await db.from("invoices").delete().eq("id", id);
  if (error) {
    throw new Error(`Failed to delete invoice: ${error.message}`);
  }
  invoicesCache = invoicesCache.filter((i) => i.id !== id);
}

export async function createDelivery(
  input: Omit<OrderDelivery, "id"> & { id?: string }
): Promise<OrderDelivery> {
  const delivery: OrderDelivery = {
    ...input,
    id: input.id ?? newId("del"),
  };
  const db = createInvoicesDb();
  const { data, error } = await db
    .from("deliveries")
    .insert(deliveryToRow(delivery))
    .select("*")
    .single();
  if (error) {
    throw new Error(`Failed to create delivery: ${error.message}`);
  }
  const saved = rowToDelivery(data as DeliveryRow);
  upsertDelivery(saved);
  return { ...saved };
}

export async function deleteDelivery(id: string): Promise<void> {
  const db = createInvoicesDb();
  const { error } = await db.from("deliveries").delete().eq("id", id);
  if (error) {
    throw new Error(`Failed to delete delivery: ${error.message}`);
  }
  deliveriesCache = deliveriesCache.filter((d) => d.id !== id);
}

export function cacheInvoice(inv: Invoice): void {
  upsertInvoice(inv);
}

export { invoiceOutstanding };
