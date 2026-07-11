import type { Client, ClientSegment, ClientType } from "@/lib/clients/types";

/** Row shape for `public.clients` (snake_case). */
export type ClientRow = {
  id: string;
  type: string;
  segment: string;
  name: string;
  phone: string;
  whatsapp?: string | null;
  email: string | null;
  contact_person: string | null;
  company: string | null;
  logo_url: string | null;
  avatar_url: string | null;
  notes: string | null;
  contacts: unknown;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
};

export type ClientContact = {
  name: string;
  role: string;
  phone?: string;
  email?: string;
};

function asContacts(value: unknown): ClientContact[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  return value.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      name: String(row.name ?? ""),
      role: String(row.role ?? ""),
      ...(row.phone != null && String(row.phone) !== ""
        ? { phone: String(row.phone) }
        : {}),
      ...(row.email != null && String(row.email) !== ""
        ? { email: String(row.email) }
        : {}),
    };
  });
}

export function rowToClient(row: ClientRow): Client {
  const contacts = asContacts(row.contacts);
  return {
    id: row.id,
    type: row.type as ClientType,
    segment: row.segment as ClientSegment,
    name: row.name,
    phone: row.phone ?? "",
    ...(row.whatsapp ? { whatsapp: row.whatsapp } : {}),
    ...(row.email ? { email: row.email } : {}),
    ...(row.contact_person ? { contactPerson: row.contact_person } : {}),
    ...(row.company ? { company: row.company } : {}),
    ...(row.logo_url ? { logoUrl: row.logo_url } : {}),
    ...(row.avatar_url ? { avatarUrl: row.avatar_url } : {}),
    ...(row.notes ? { notes: row.notes } : {}),
    ...(contacts ? { contacts } : {}),
    createdAt: row.created_at,
    isActive: row.is_active,
  };
}

export function clientToRow(
  client: Omit<Client, "createdAt"> & { createdAt?: string }
): Record<string, unknown> {
  return {
    id: client.id,
    type: client.type,
    segment: client.segment,
    name: client.name,
    phone: client.phone ?? "",
    whatsapp: client.whatsapp ?? null,
    email: client.email ?? null,
    contact_person: client.contactPerson ?? null,
    company: client.company ?? null,
    logo_url: client.logoUrl ?? null,
    avatar_url: client.avatarUrl ?? null,
    notes: client.notes ?? null,
    contacts: client.contacts ?? [],
    is_active: client.isActive,
    ...(client.createdAt ? { created_at: client.createdAt } : {}),
  };
}
