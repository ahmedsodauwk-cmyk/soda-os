/**
 * Equipment inventory + assignment history per person/item.
 * Smart Ops: optional order/project date-range booking with conflict checks.
 */

export const EQUIPMENT_TYPES = [
  "Camera",
  "Lens",
  "Drone",
  "Laptop",
  "Monitor",
  "SSD",
  "Lighting",
  "Accessories",
] as const;

export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];

export const EQUIPMENT_STATUSES = [
  "available",
  "assigned",
  "maintenance",
  "retired",
] as const;

export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[number];

export interface EquipmentItem {
  id: string;
  name: string;
  type: EquipmentType;
  serialNumber?: string;
  status: EquipmentStatus;
  notes?: string;
  acquiredAt: string;
}

/** One assignment period of equipment to a person (optionally for an order). */
export interface EquipmentAssignment {
  id: string;
  equipmentId: string;
  personId: string;
  assignedAt: string;
  returnedAt?: string;
  note?: string;
  orderId?: string;
  projectId?: string;
  /** Inclusive start date for booking (YYYY-MM-DD) */
  startsOn?: string;
  /** Inclusive end date for booking (YYYY-MM-DD) */
  endsOn?: string;
}
