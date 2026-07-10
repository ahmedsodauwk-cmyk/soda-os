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
  clientName: string;
  phone: string;
  projectType: ProjectType;
  shootDate: string;
  location: string;
  deliveryDate: string;
  price: number;
  deposit: number;
  team: string;
  status: OrderStatus;
  notes: string;
}

export type NewOrderInput = Omit<Order, "id">;

export const TEAMS = [
  "Alpha Crew",
  "Studio A",
  "Outdoor Unit",
  "Commercial Team",
  "Wedding Squad",
] as const;
