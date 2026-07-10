import type { Order } from "@/lib/orders/types";

/**
 * Every order links to a Project (projectId) and Client (clientId).
 * workspaceId / subcategoryId remain denormalized for Phase 2 Orders filters.
 * Starts empty — create flows append via repositories.
 */
export const mockOrders: Order[] = [];
