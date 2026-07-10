export const CLIENT_TYPES = ["individual", "company"] as const;

export type ClientType = (typeof CLIENT_TYPES)[number];

export interface Client {
  id: string;
  type: ClientType;
  /** Person name for individuals, company name for companies */
  name: string;
  phone: string;
  email?: string;
  /** Primary contact for company clients */
  contactPerson?: string;
  /** Optional display alias (e.g. brand name) */
  company?: string;
  avatarUrl?: string;
  notes?: string;
  createdAt: string;
  isActive: boolean;
}

export type NewClientInput = Omit<Client, "id" | "createdAt" | "isActive">;
