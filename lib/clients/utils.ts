import type { Client } from "@/lib/clients/types";

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function generateClientId(existingCount: number): string {
  const next = existingCount + 1;
  return `client-${String(next).padStart(3, "0")}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function filterClients(
  clients: Client[],
  search: string,
  typeFilter: string
): Client[] {
  const query = search.trim().toLowerCase();

  return clients.filter((client) => {
    const matchesType = typeFilter === "all" || client.type === typeFilter;

    if (!matchesType) return false;
    if (!query) return true;

    const searchable = [
      client.id,
      client.name,
      client.phone,
      client.email,
      client.contactPerson,
      client.company,
      client.notes,
      formatClientType(client.type),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(query);
  });
}

export function getClientDisplayName(client: Client): string {
  if (client.type === "company" && client.company) {
    return client.company;
  }
  return client.name;
}

export function getClientContactLabel(client: Client): string {
  if (client.type === "company" && client.contactPerson) {
    return client.contactPerson;
  }
  return client.name;
}

export function formatClientType(type: Client["type"]): string {
  return type === "company" ? "Company" : "Individual";
}

export function isCompanyClient(client: Client): boolean {
  return client.type === "company";
}
