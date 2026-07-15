/**
 * Safe environment metadata — names + presence only.
 * Never includes values for secrets, passwords, keys, or tokens.
 */

import type { EnvPresence } from "@/lib/backup/types";

const SECRET_NAME_RE =
  /(SECRET|PASSWORD|PASSWD|TOKEN|API_KEY|PRIVATE|CREDENTIAL|SERVICE_ROLE)/i;

/** Known SODA env keys to report (presence only). */
const TRACKED_ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "DATABASE_URL",
  "SUPABASE_DB_PASSWORD",
  "SODA_AUTH_STRICT",
  "ALLOW_IN_MEMORY_BUSINESS_CORE",
  "VERCEL",
  "VERCEL_ENV",
  "VERCEL_GIT_COMMIT_SHA",
  "NODE_ENV",
] as const;

function isSecretKey(name: string): boolean {
  return SECRET_NAME_RE.test(name);
}

/**
 * Build env presence map. Values are never exported — only whether a key is set.
 * Secret-named keys still report presence (boolean), never content.
 */
export function collectSafeEnvMetadata(): EnvPresence {
  const out: EnvPresence = {};
  for (const key of TRACKED_ENV_KEYS) {
    const raw = process.env[key];
    out[key] = { present: Boolean(raw && String(raw).trim().length > 0) };
  }

  // Also note any other NEXT_PUBLIC_* keys by name (presence only).
  for (const key of Object.keys(process.env).sort()) {
    if (out[key]) continue;
    if (!key.startsWith("NEXT_PUBLIC_")) continue;
    if (isSecretKey(key)) {
      out[key] = {
        present: Boolean(process.env[key]?.trim()),
      };
      continue;
    }
    out[key] = {
      present: Boolean(process.env[key]?.trim()),
    };
  }

  return out;
}

/** Strip accidental secret values from arbitrary objects before serialization. */
export function redactSecretFields<T extends Record<string, unknown>>(
  input: T
): T {
  const out: Record<string, unknown> = { ...input };
  for (const key of Object.keys(out)) {
    if (isSecretKey(key)) {
      out[key] = "[redacted]";
    }
  }
  return out as T;
}
