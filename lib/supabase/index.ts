/**
 * Supabase foundation for Soda OS (Sprint 15).
 *
 * Domain repositories remain on empty in-memory stores.
 * Wire reads/writes to these clients in a later sprint after migrations are applied.
 */

export { isSupabaseConfigured, requireSupabaseEnv } from "@/lib/supabase/env";
export { checkSupabaseConnection } from "@/lib/supabase/health";
export type { SupabaseHealthResult } from "@/lib/supabase/health";
