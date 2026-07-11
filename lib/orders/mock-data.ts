import type { Order } from "@/lib/orders/types";

/**
 * Legacy empty array — do not use as source of truth.
 * Orders live in Supabase via `lib/orders/repository`.
 */
export const mockOrders: Order[] = [];
