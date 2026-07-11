/**
 * Supabase foundation for Soda OS (Sprint 15–16).
 *
 * Connection helpers + health probe. Domain repositories remain on
 * in-memory / mock stores until a later sprint wires Postgres reads/writes.
 */

export { isSupabaseConfigured, requireSupabaseEnv } from "@/lib/supabase/env";
export { checkSupabaseConnection } from "@/lib/supabase/health";
export type { SupabaseHealthResult } from "@/lib/supabase/health";
