import type { EquipmentAssignment, EquipmentItem } from "@/lib/equipment/types";

/**
 * Legacy empty arrays — do not use as source of truth.
 * Equipment lives in Supabase via `lib/equipment/repository`.
 */
export const mockEquipment: EquipmentItem[] = [];
export const mockEquipmentAssignments: EquipmentAssignment[] = [];
