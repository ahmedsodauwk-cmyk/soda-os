import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  getSupabaseServiceRoleKey,
  requireSupabaseEnv,
} from "@/lib/supabase/env";

/**
 * Domain repository Supabase client.
 * Prefers service role on the server when available (bypasses RLS);
 * otherwise uses the anon key.
 */
export function createDomainDb(): SupabaseClient {
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
