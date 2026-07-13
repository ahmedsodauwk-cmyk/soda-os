import { computeClientStats } from "@/lib/business/client-stats";
import type { ClientComputedStats } from "@/lib/business/types";
import { createClientsDb } from "@/lib/clients/db";
import { clientToRow, rowToClient, type ClientRow } from "@/lib/clients/mappers";
import {
  DEFAULT_CLIENT_BUSINESS_ROLE,
  type Client,
  type NewClientInput,
} from "@/lib/clients/types";
import { publishBusinessEvent } from "@/lib/core/publish";
import { getOrders } from "@/lib/orders/repository";
import { getPayments } from "@/lib/payments/repository";
import { getProjects } from "@/lib/projects/repository";
import { withRefreshTtl } from "@/lib/supabase/refresh-ttl";

/**
 * In-memory mirror so existing sync callers (other modules) keep working.
 * Source of truth is `public.clients` — call `refreshClients()` / async CRUD
 * from the Clients UI and routes to keep this cache current.
 */
let clientsCache: Client[] = [];

function sortByCreatedDesc(a: Client, b: Client): number {
  return b.createdAt.localeCompare(a.createdAt);
}

function setCache(clients: Client[]): Client[] {
  clientsCache = [...clients].sort(sortByCreatedDesc);
  return clientsCache;
}

function upsertCache(client: Client): void {
  const next = clientsCache.filter((c) => c.id !== client.id);
  next.unshift(client);
  clientsCache = next;
}

function removeFromCache(id: string): void {
  clientsCache = clientsCache.filter((c) => c.id !== id);
}

function newClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `client-${crypto.randomUUID()}`;
  }
  return `client-${Date.now().toString(36)}`;
}

async function selectAllRows(): Promise<ClientRow[]> {
  const db = createClientsDb();
  const { data, error } = await db
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load clients: ${error.message}`);
  }
  return (data ?? []) as ClientRow[];
}

/** Load all clients from Supabase into the sync cache (warm TTL). */
export const refreshClients = withRefreshTtl({
  key: "clients",
  hasData: () => clientsCache.length > 0,
  read: () => getAllClients(),
  load: async () => {
    const rows = await selectAllRows();
    return setCache(rows.map(rowToClient));
  },
});

export function getClients(): Client[] {
  return clientsCache.filter((c) => c.isActive);
}

export function getAllClients(): Client[] {
  return [...clientsCache];
}

export function getClientById(id: string): Client | undefined {
  return clientsCache.find((c) => c.id === id);
}

/** Fetch one client from Supabase (updates cache on hit). */
export async function fetchClientById(
  id: string
): Promise<Client | undefined> {
  const db = createClientsDb();
  const { data, error } = await db
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load client ${id}: ${error.message}`);
  }
  if (!data) return undefined;
  const client = rowToClient(data as ClientRow);
  upsertCache(client);
  return client;
}

/** Persist a new client to Supabase and the sync cache. */
export async function createClient(input: NewClientInput): Promise<Client> {
  const client: Client = {
    id: newClientId(),
    createdAt: new Date().toISOString(),
    isActive: true,
    ...input,
    businessRole: input.businessRole ?? DEFAULT_CLIENT_BUSINESS_ROLE,
  };

  const db = createClientsDb();
  let row = clientToRow(client);
  let { data, error } = await db.from("clients").insert(row).select("*").single();

  // Pre-migration compat: drop columns that may not exist yet
  for (const col of ["whatsapp", "business_role"] as const) {
    if (error && new RegExp(col, "i").test(error.message) && col in row) {
      const next = { ...row };
      delete next[col];
      row = next;
      ({ data, error } = await db
        .from("clients")
        .insert(row)
        .select("*")
        .single());
    }
  }

  if (error) {
    throw new Error(`Failed to create client: ${error.message}`);
  }

  const saved = rowToClient(data as ClientRow);
  // Preserve fields in cache even if column not yet migrated
  if (client.whatsapp && !saved.whatsapp) {
    saved.whatsapp = client.whatsapp;
  }
  if (client.businessRole && saved.businessRole !== client.businessRole) {
    saved.businessRole = client.businessRole;
  }
  upsertCache(saved);
  await publishBusinessEvent({
    type: "ClientCreated",
    source: "clients.repository.createClient",
    payload: {
      entityId: saved.id,
      entityType: "client",
      clientId: saved.id,
      summary: `Client created: ${saved.name}`,
      data: { name: saved.name, segment: saved.segment, type: saved.type },
    },
  });
  return { ...saved };
}

export type UpdateClientInput = Partial<
  Omit<Client, "id" | "createdAt">
>;

/** Update an existing client in Supabase and the sync cache. */
export async function updateClient(
  id: string,
  patch: UpdateClientInput
): Promise<Client> {
  const existing = getClientById(id) ?? (await fetchClientById(id));
  if (!existing) {
    throw new Error(`Client not found: ${id}`);
  }

  const merged: Client = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
  };

  const db = createClientsDb();
  let row = clientToRow(merged);
  delete row.id;
  delete row.created_at;

  let { data, error } = await db
    .from("clients")
    .update(row)
    .eq("id", id)
    .select("*")
    .single();

  for (const col of ["whatsapp", "business_role"] as const) {
    if (error && new RegExp(col, "i").test(error.message) && col in row) {
      const next = { ...row };
      delete next[col];
      row = next;
      ({ data, error } = await db
        .from("clients")
        .update(row)
        .eq("id", id)
        .select("*")
        .single());
    }
  }

  if (error) {
    throw new Error(`Failed to update client: ${error.message}`);
  }

  const saved = rowToClient(data as ClientRow);
  if (merged.whatsapp && !saved.whatsapp) {
    saved.whatsapp = merged.whatsapp;
  }
  upsertCache(saved);
  await publishBusinessEvent({
    type: "ClientUpdated",
    source: "clients.repository.updateClient",
    payload: {
      entityId: saved.id,
      entityType: "client",
      clientId: saved.id,
      summary: `Client updated: ${saved.name}`,
      data: { patch: Object.keys(patch) },
    },
  });
  return { ...saved };
}

/** Hard-delete a client from Supabase and the sync cache. */
export async function deleteClient(id: string): Promise<void> {
  const db = createClientsDb();
  const { error } = await db.from("clients").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete client: ${error.message}`);
  }
  removeFromCache(id);
}

export function getClientsByType(type: Client["type"]): Client[] {
  return clientsCache.filter((c) => c.type === type && c.isActive);
}

export function getClientsBySegment(segment: Client["segment"]): Client[] {
  return clientsCache.filter((c) => c.segment === segment && c.isActive);
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
