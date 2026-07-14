import type { Person } from "@/lib/people/types";

/** Suggest a login username from crew profile — Founder may edit before save. */
export function suggestUsernameFromPerson(person: Person): string {
  const raw =
    person.displayName?.trim() ||
    person.nickname?.trim() ||
    person.nameEn.trim();
  const slug = raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .replace(/\.{2,}/g, ".");
  if (slug.length >= 3) return slug.slice(0, 32);
  const fallback = person.nameEn
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  return (fallback || `crew.${person.id.slice(-6)}`).slice(0, 32);
}
