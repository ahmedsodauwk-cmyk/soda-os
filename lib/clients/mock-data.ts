import type { Client } from "@/lib/clients/types";

/**
 * Legacy empty array — do not use as source of truth.
 * Clients live in Supabase `public.clients` via `lib/clients/repository`.
 */
export const mockClients: Client[] = [];
