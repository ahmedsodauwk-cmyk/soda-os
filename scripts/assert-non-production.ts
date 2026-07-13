/**
 * Refuse smoke / seed / destructive scripts against Production.
 *
 * Policy: docs/SODA_MASTER/FOUNDER_DATA_POLICY.md
 *
 * Triggers refuse when:
 * - VERCEL_ENV=production
 * - NEXT_PUBLIC_SUPABASE_URL hosts the Production Supabase project
 *
 * Override (emergency only): SODA_ALLOW_PRODUCTION_SMOKE=1
 * Never use the override for routine testing.
 */

/** Production Supabase project ref(s). Keep in sync with live SODA OS. */
export const PRODUCTION_SUPABASE_PROJECT_REFS = [
  "wtjdqxzljtxzgykknspa",
] as const;

export function isProductionSupabaseUrl(url: string | undefined): boolean {
  if (!url) return false;
  const normalized = url.trim().toLowerCase();
  return PRODUCTION_SUPABASE_PROJECT_REFS.some((ref) =>
    normalized.includes(ref.toLowerCase())
  );
}

export function assertNonProductionTarget(scriptLabel = "smoke/seed"): void {
  if (process.env.SODA_ALLOW_PRODUCTION_SMOKE === "1") {
    console.warn(
      `[${scriptLabel}] WARNING: SODA_ALLOW_PRODUCTION_SMOKE=1 — production guard bypassed. Do not leave this set.`
    );
    return;
  }

  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();
  if (vercelEnv === "production") {
    throw new Error(
      `[${scriptLabel}] REFUSED: VERCEL_ENV=production. ` +
        `Smoke/seed scripts must never write business data to Production. ` +
        `See docs/SODA_MASTER/FOUNDER_DATA_POLICY.md`
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (isProductionSupabaseUrl(url)) {
    throw new Error(
      `[${scriptLabel}] REFUSED: NEXT_PUBLIC_SUPABASE_URL points at Production Supabase (${url}). ` +
        `Use a separate development project for smoke tests. ` +
        `See docs/SODA_MASTER/FOUNDER_DATA_POLICY.md`
    );
  }
}
