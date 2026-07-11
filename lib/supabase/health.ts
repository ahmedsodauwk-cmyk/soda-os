import { createClient } from "@supabase/supabase-js";

import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/env";

export type SupabaseHealthResult = {
  configured: boolean;
  ok: boolean;
  message: string;
  /** Present when a probe against PostgREST succeeded or failed with detail. */
  detail?: string;
};

/**
 * Lightweight connection probe — does not require tables to exist.
 * Safe to call from scripts or a future health route; does not throw.
 */
export async function checkSupabaseConnection(): Promise<SupabaseHealthResult> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      ok: false,
      message:
        "Supabase env not configured. Copy .env.example → .env.local and set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const url = getSupabaseUrl()!;
  const anonKey = getSupabaseAnonKey()!;

  try {
    const client = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Hit PostgREST root via a no-op select; missing tables still prove connectivity
    // (PGRST205 / relation does not exist) vs network/auth failures.
    const { error } = await client.from("_soda_health_probe").select("*").limit(0);

    if (!error) {
      return {
        configured: true,
        ok: true,
        message: "Connected to Supabase (probe table reachable).",
      };
    }

    const code = error.code ?? "";
    const msg = error.message ?? String(error);

    // Schema cache / missing relation = API is up and auth worked.
    if (
      code === "PGRST205" ||
      code === "42P01" ||
      /could not find the table|relation .* does not exist|schema cache/i.test(msg)
    ) {
      return {
        configured: true,
        ok: true,
        message: "Connected to Supabase API (apply migrations to create tables).",
        detail: msg,
      };
    }

    // JWT / key issues
    if (
      code === "PGRST301" ||
      /JWT|Invalid API key|unauthorized/i.test(msg)
    ) {
      return {
        configured: true,
        ok: false,
        message: "Supabase reachable but credentials rejected.",
        detail: msg,
      };
    }

    return {
      configured: true,
      ok: false,
      message: "Supabase probe failed.",
      detail: msg,
    };
  } catch (err) {
    return {
      configured: true,
      ok: false,
      message: "Could not reach Supabase.",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}
