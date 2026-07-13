export const CLIENT_TYPES = ["individual", "company"] as const;

export type ClientType = (typeof CLIENT_TYPES)[number];

/** Business segment — drives Clients hub split. */
export const CLIENT_SEGMENTS = ["wedding", "commercial"] as const;

export type ClientSegment = (typeof CLIENT_SEGMENTS)[number];

/**
 * Business role of a Client entity (not a separate table).
 * - client: buys work from SODA
 * - partner: collaborates / refers / co-produces
 * - both: acts as Client and Partner
 */
export const CLIENT_BUSINESS_ROLES = ["client", "partner", "both"] as const;

export type ClientBusinessRole = (typeof CLIENT_BUSINESS_ROLES)[number];

export const DEFAULT_CLIENT_BUSINESS_ROLE: ClientBusinessRole = "client";

export interface Client {
  id: string;
  type: ClientType;
  /** Wedding couples vs commercial companies */
  segment: ClientSegment;
  /**
   * Business relationship role. Defaults to `client`.
   * Partners and Client+Partner share this entity — not separate modules.
   */
  businessRole: ClientBusinessRole;
  /** Person name for individuals, company name for companies */
  name: string;
  phone: string;
  /** WhatsApp number (may differ from phone) */
  whatsapp?: string;
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

export type NewClientInput = Omit<
  Client,
  "id" | "createdAt" | "isActive" | "businessRole"
> & {
  /** Optional on create — defaults to `client` */
  businessRole?: ClientBusinessRole;
};
