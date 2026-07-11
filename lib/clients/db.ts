import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  getSupabaseServiceRoleKey,
  requireSupabaseEnv,
} from "@/lib/supabase/env";

/**
 * Supabase client for the clients repository.
 * Prefers service role on the server when available (bypasses RLS);
 * otherwise uses the anon key (browser + server without service role).
 */
export function createClientsDb(): SupabaseClient {
  const { url, anonKey } = requireSupabaseEnv();
  const serviceKey =
    typeof window === "undefined" ? getSupabaseServiceRoleKey() : undefined;
  return createClient(url, serviceKey ?? anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
