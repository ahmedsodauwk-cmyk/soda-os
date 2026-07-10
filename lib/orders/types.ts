export const ORDER_STATUSES = [
  "Pending",
  "Scheduled",
  "Shooting",
  "Editing",
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

export interface Order {
  id: string;
  /** Required — Order belongs to exactly one Project */
  projectId: string;
  /** Denormalized from Project.clientId for UI / filters */
  clientId?: string;
  clientName: string;
  phone: string;
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
  team: string;
  status: OrderStatus;
  notes: string;
}

/** Form input — projectId/clientId may be assigned on submit via business helpers */
export type NewOrderInput = Omit<Order, "id" | "projectId" | "clientId"> & {
  projectId?: string;
  clientId?: string;
};

export const TEAMS = [
  "Alpha Crew",
  "Studio A",
  "Outdoor Unit",
  "Commercial Team",
  "Wedding Squad",
] as const;
