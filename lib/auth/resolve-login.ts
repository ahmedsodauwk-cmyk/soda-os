/**
 * Resolve login identifier (username OR email) → auth email for Supabase.
 */

import { createClient } from "@/lib/supabase/server";
import {
  companyEmailForUsername,
  getCompanyEmailDomain,
} from "@/lib/auth/company-email";

/**
 * Maps username or email to the email used by auth.users.
 * Prefers DB RPC `resolve_login_email`; falls back to local construction.
 */
export async function resolveLoginEmail(
  identifier: string
): Promise<string | null> {
  const raw = identifier.trim();
  if (!raw) return null;

  if (raw.includes("@")) {
    return raw.toLowerCase();
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("resolve_login_email", {
      identifier: raw,
    });
    if (!error && typeof data === "string" && data.includes("@")) {
      return data.toLowerCase();
    }
  } catch {
    // RPC missing until migration applied
  }

  const domain = await getCompanyEmailDomain();
  return companyEmailForUsername(raw, domain);
}
