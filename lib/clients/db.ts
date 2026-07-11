import { createDomainDb } from "@/lib/supabase/domain-db";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client for the clients repository.
 * Prefers service role on the server when available (bypasses RLS);
 * otherwise uses the anon key (browser + server without service role).
 */
export function createClientsDb(): SupabaseClient {
  return createDomainDb();
}
