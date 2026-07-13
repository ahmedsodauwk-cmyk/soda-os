/**
 * Client-safe company email constants (no next/headers / server imports).
 */

export const DEFAULT_COMPANY_EMAIL_DOMAIN = "sodavisuals.com";
export const COMPANY_DISPLAY_NAME = "SODA VISUALS";

/** Sync fallback — env only (no DB). Safe for client + server. */
export function getCompanyEmailDomainSync(): string {
  const raw =
    (typeof process !== "undefined" &&
      (process.env.SODA_COMPANY_EMAIL_DOMAIN?.trim() ||
        process.env.NEXT_PUBLIC_SODA_COMPANY_EMAIL_DOMAIN?.trim())) ||
    "";
  if (raw) return raw.replace(/^@/, "").toLowerCase();
  return DEFAULT_COMPANY_EMAIL_DOMAIN;
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
