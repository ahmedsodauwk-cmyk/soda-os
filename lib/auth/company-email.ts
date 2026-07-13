/**
 * Company email domain — configurable from Settings (DB) with env fallback.
 * Default: sodavisuals.com
 *
 * Architecture: prefer `app_settings.company_email_domain`, then
 * `SODA_COMPANY_EMAIL_DOMAIN` / `NEXT_PUBLIC_SODA_COMPANY_EMAIL_DOMAIN`, then default.
 */

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export const DEFAULT_COMPANY_EMAIL_DOMAIN = "sodavisuals.com";
export const COMPANY_DISPLAY_NAME = "SODA VISUALS";

function envDomain(): string | null {
  const raw =
    process.env.SODA_COMPANY_EMAIL_DOMAIN?.trim() ||
    process.env.NEXT_PUBLIC_SODA_COMPANY_EMAIL_DOMAIN?.trim();
  if (!raw) return null;
  return raw.replace(/^@/, "").toLowerCase();
}

/** Sync fallback (no DB) — use when outside RSC or before settings hydrate. */
export function getCompanyEmailDomainSync(): string {
  return envDomain() ?? DEFAULT_COMPANY_EMAIL_DOMAIN;
}

/** Build company email from username local-part. */
export function companyEmailForUsername(
  username: string,
  domain: string = getCompanyEmailDomainSync()
): string {
  const local = username.trim().toLowerCase().replace(/^@/, "");
  const d = domain.replace(/^@/, "").toLowerCase();
  return `${local}@${d}`;
}

/**
 * Resolve company email domain: DB setting → env → default.
 * Deduped per request.
 */
export const getCompanyEmailDomain = cache(async (): Promise<string> => {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "company_email_domain")
      .maybeSingle();
    const value =
      typeof data?.value === "string" ? data.value.trim().replace(/^@/, "") : "";
    if (value) return value.toLowerCase();
  } catch {
    // Table may not exist until migration applied
  }
  return getCompanyEmailDomainSync();
});

/** Persist domain (Owner/Admin). Returns false on failure / missing table. */
export async function setCompanyEmailDomain(
  domain: string
): Promise<{ ok: boolean; error?: string }> {
  const cleaned = domain.trim().replace(/^@/, "").toLowerCase();
  if (!cleaned || cleaned.includes("@") || cleaned.includes(" ")) {
    return { ok: false, error: "Enter a domain like sodavisuals.com" };
  }
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("app_settings").upsert(
      {
        key: "company_email_domain",
        value: cleaned,
        description:
          "Company email domain for username@domain construction. Changeable from Settings.",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to save domain",
    };
  }
}
