import type { OrderAssignment } from "@/lib/assignments/types";

/**
 * Crew assignments with prices — source of truth for people payments.
 * Starts empty — assignment create flows append via repository.
 */
export const mockAssignments: OrderAssignment[] = [];
