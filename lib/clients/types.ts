export const CLIENT_TYPES = ["individual", "company"] as const;

export type ClientType = (typeof CLIENT_TYPES)[number];

/** Business segment — drives Clients hub split. */
export const CLIENT_SEGMENTS = ["wedding", "commercial"] as const;

export type ClientSegment = (typeof CLIENT_SEGMENTS)[number];

export interface Client {
  id: string;
  type: ClientType;
  /** Wedding couples vs commercial companies */
  segment: ClientSegment;
  /** Person name for individuals, company name for companies */
  name: string;
  phone: string;
  email?: string;
  /** Primary contact for company clients */
  contactPerson?: string;
  /** Optional display alias (e.g. brand name) */
  company?: string;
  /** Company logo URL (commercial) */
  logoUrl?: string;
  avatarUrl?: string;
  notes?: string;
  /** Extra commercial contacts */
  contacts?: Array<{ name: string; role: string; phone?: string; email?: string }>;
  createdAt: string;
  isActive: boolean;
}

export type NewClientInput = Omit<Client, "id" | "createdAt" | "isActive">;
