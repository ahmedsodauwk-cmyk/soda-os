import type { Person } from "@/lib/people/types";

/** Login usernames: 3–32 chars, start/end alphanumeric; dots, hyphens, underscores allowed. */
export const USERNAME_RE = /^[a-z0-9]([a-z0-9._-]{1,30}[a-z0-9])?$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/^@/, "");
}

export function isValidUsernameFormat(username: string): boolean {
  const normalized = normalizeUsername(username);
  return normalized.length >= 3 && USERNAME_RE.test(normalized);
}

/** Trim to 32 and strip trailing separators so suggestions always pass USERNAME_RE. */
function finalizeUsernameSlug(slug: string, personId: string): string {
  let out = slug.slice(0, 32).replace(/[._-]+$/g, "");
  if (out.length >= 3 && USERNAME_RE.test(out)) return out;
  out = `crew.${personId.replace(/[^a-z0-9]/gi, "").slice(-6) || "user"}`;
  return out.slice(0, 32);
}

/** Suggest a login username from crew profile — Founder may edit before save. */
export function suggestUsernameFromPerson(person: Person): string {
  // Prefer English legal name (Ali Hesham → ali.hesham); fall back to display/nickname.
  const raw =
    person.nameEn.trim() ||
    person.displayName?.trim() ||
    person.nickname?.trim() ||
    "";
  const slug = raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .replace(/\.{2,}/g, ".");
  if (slug.length >= 3) return finalizeUsernameSlug(slug, person.id);
  const fallback = (person.displayName || person.nickname || person.nameEn)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  return finalizeUsernameSlug(
    fallback || `crew.${person.id.slice(-6)}`,
    person.id
  );
}
