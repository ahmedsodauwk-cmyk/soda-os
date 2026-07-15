/**
 * Auth strictness — single source of truth for middleware + session resolution.
 *
 * Vercel Production (`VERCEL_ENV=production`) ALWAYS fails closed.
 * `SODA_AUTH_STRICT=0` is Development/Preview only and is ignored on Production.
 * Never use `SODA_AUTH_STRICT=0` as a Production recovery mechanism.
 */

export function isAuthStrict(): boolean {
  // Production always forces strict — ignore SODA_AUTH_STRICT=0.
  if (process.env.VERCEL_ENV === "production") return true;
  if (process.env.SODA_AUTH_STRICT === "0") return false;
  if (process.env.SODA_AUTH_STRICT === "1") return true;
  // Development / Preview default: allow intentional local owner fallback.
  return false;
}

/**
 * Whether signed-out AppShell may synthesize the local owner (Founder) fallback.
 * Always false on Vercel Production — fail closed, never Founder/Team by env.
 */
export function allowsSignedOutOwnerFallback(): boolean {
  return !isAuthStrict();
}
