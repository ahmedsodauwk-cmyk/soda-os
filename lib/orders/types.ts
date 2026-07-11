export const ORDER_STATUSES = [
  "Holding",
  "Confirmed",
  "Pending",
  "Scheduled",
  "Shooting",
  "Editing",
  "Completed",
  "Delivered",
  "Cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PROJECT_TYPES = [
  "Wedding",
  "Engagement",
  "Commercial",
  "Portrait",
  "Event",
  "Product",
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

export const DRESS_CODES = [
  "Formal",
  "Black",
  "White",
  "Traditional",
  "Casual",
  "Custom",
] as const;

export type DressCode = (typeof DRESS_CODES)[number];

export const ORDER_PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export type OrderPriority = (typeof ORDER_PRIORITIES)[number];

export interface Order {
  id: string;
  /** Required — Order belongs to exactly one Project */
  projectId: string;
  /** Denormalized from Project.clientId for UI / filters */
  clientId?: string;
  clientName: string;
  phone: string;
  /** WhatsApp (order-level snapshot; client profile is source of truth after create) */
  whatsapp: string;
  projectType: ProjectType;
  /** Denormalized taxonomy workspace id — Phase 2 filters keep working */
  workspaceId: string;
  /** Optional taxonomy subcategory id (e.g. rtm-future-city) */
  subcategoryId?: string;
  shootDate: string;
  location: string;
  deliveryDate: string;
  price: number;
  deposit: number;
  /** Squad label (e.g. Wedding Squad) */
  team: string;
  /** Selected crew member ids for auto-assignments */
  squadMemberIds: string[];
  status: OrderStatus;
  priority: OrderPriority;
  brief: string;
  dressCode?: DressCode;
  latePenaltyEnabled: boolean;
  latePenaltyAmount: number;
  latePenaltyReason: string;
  notes: string;
}

/** Form input — projectId/clientId may be assigned on submit via business helpers */
export type NewOrderInput = Omit<
  Order,
  "id" | "projectId" | "clientId" | "priority"
> & {
  projectId?: string;
  clientId?: string;
  priority?: OrderPriority;
};

/**
 * Smart Order Engine create/update payload.
 * Extends NewOrderInput with inline client/project creation flags.
 */
export type SmartOrderInput = NewOrderInput & {
  /** Create a new client inline (phone editable only on first create) */
  createNewClient?: boolean;
  /** Create a new project linked to the client */
  createNewProject?: boolean;
  /** Optional display name when creating a new project */
  projectName?: string;
  /** Default role for auto-created assignments */
  assignmentRole?: string;
  /** Default employee price for auto-created assignments */
  assignmentPrice?: number;
};

export const TEAMS = [
  "Alpha Crew",
  "Studio A",
  "Outdoor Unit",
  "Commercial Team",
  "Wedding Squad",
] as const;
