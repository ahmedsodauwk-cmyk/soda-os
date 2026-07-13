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

/** Deliverable checklist on create (wizard step 3). */
export const ORDER_DELIVERABLES = [
  "Promo",
  "Edited Photos",
  "RAW",
  "Album",
  "Session",
  "Party",
  "Reels",
] as const;

export type OrderDeliverable = (typeof ORDER_DELIVERABLES)[number];

export const ORDER_PACKAGES = [
  "Essential",
  "Classic",
  "Premium",
  "Signature",
  "Custom",
] as const;

export type OrderPackage = (typeof ORDER_PACKAGES)[number];

export const PLANNED_EXPENSE_KINDS = [
  "transportation",
  "rentals",
  "freelancers",
  "other",
] as const;

export type PlannedExpenseKind = (typeof PLANNED_EXPENSE_KINDS)[number];

export interface PlannedExpenseLine {
  kind: PlannedExpenseKind;
  label?: string;
  amount: number;
  notes?: string;
}

/** Crew operational status transitions (started / completed / material delivered). */
export const CREW_OPERATIONAL_STATUSES = [
  "Shooting",
  "Editing",
  "Completed",
  "Delivered",
] as const;

export type CrewOperationalStatus = (typeof CREW_OPERATIONAL_STATUSES)[number];

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
  /**
   * Optional taxonomy subcategory id (lane within a workspace).
   * Not a Client identity — Clients live in `public.clients` only.
   */
  subcategoryId?: string;
  /**
   * Architectural note (Mission 04.1): every Order belongs to one Client.
   * Belonging is either Daily Work under that Client, or a Project that
   * itself belongs to that Client. See `OrderClientBelonging` in
   * `lib/clients/workspace.ts`. Persistence of belonging is deferred —
   * today orders still link via `projectId` (+ denormalized `clientId`).
   */
  shootDate: string;
  location: string;
  deliveryDate: string;
  price: number;
  deposit: number;
  /** Squad label (e.g. Wedding Squad) — display name, never an id */
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
  /** Commercial package name */
  packageName: string;
  /** Selected deliverables (Promo, Reels, …) */
  deliverables: OrderDeliverable[];
  /** Required when deliverables includes Reels */
  reelCount: number;
  /** Planned expenses captured at create time */
  plannedExpenses: PlannedExpenseLine[];
}

/** Form input — projectId/clientId may be assigned on submit via business helpers */
export type NewOrderInput = Omit<
  Order,
  | "id"
  | "projectId"
  | "clientId"
  | "priority"
  | "packageName"
  | "deliverables"
  | "reelCount"
  | "plannedExpenses"
> & {
  projectId?: string;
  clientId?: string;
  priority?: OrderPriority;
  packageName?: string;
  deliverables?: OrderDeliverable[];
  reelCount?: number;
  plannedExpenses?: PlannedExpenseLine[];
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
  /** Per-crew salary overrides (personId → EGP) */
  memberSalaries?: Record<string, number>;
};

export const TEAMS = [
  "Alpha Crew",
  "Studio A",
  "Outdoor Unit",
  "Commercial Team",
  "Wedding Squad",
] as const;
