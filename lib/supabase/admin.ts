import { createClient } from "@supabase/supabase-js";

import {
  getSupabaseServiceRoleKey,
  requireSupabaseEnv,
} from "@/lib/supabase/env";

/**
 * Service-role client — server-only admin / migration scripts.
 * Never import this module from Client Components or expose the key.
 */
export function createAdminClient() {
  const { url } = requireSupabaseEnv();
  const serviceKey = getSupabaseServiceRoleKey();
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it in Vercel → Settings → Environment Variables (Production) and redeploy, or set it in .env.local for local admin scripts."
    );
  }
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
