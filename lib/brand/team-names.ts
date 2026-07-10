/**
 * Arabic display names for studio team — IDs/logic stay English.
 * Roles remain English in the UI; names feel like a teammate roll call.
 * Maps are filled as real crew is added (no demo roster).
 */

const BY_ID: Record<string, string> = {};

const BY_ENGLISH_NAME: Record<string, string> = {
  "Junior Soda": "چونيور صودا",
};

/** Resolve Arabic display name; falls back to the English name if unmapped. */
export function getTeamDisplayName(englishName: string, id?: string): string {
  if (id && BY_ID[id]) return BY_ID[id]!;
  return BY_ENGLISH_NAME[englishName] ?? englishName;
}
