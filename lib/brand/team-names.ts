/**
 * Arabic display names for studio team — IDs/logic stay English.
 * Roles remain English in the UI; names feel like a teammate roll call.
 */

const BY_ID: Record<string, string> = {
  "tm-ahmed": "نيمو",
  "tm-sara": "سارة",
  "tm-karim": "كريم",
  "tm-layla": "ليلى",
  "tm-omar": "عمر",
  "tm-dina": "دينا",
  "tm-youssef": "يوسف",
  "tm-nora": "نورا",
};

const BY_ENGLISH_NAME: Record<string, string> = {
  "Ahmed Hassan": "نيمو",
  "Sara Nabil": "سارة",
  "Karim Fouad": "كريم",
  "Layla Mansour": "ليلى",
  "Omar Saleh": "عمر",
  "Dina Farid": "دينا",
  "Youssef Amir": "يوسف",
  "Nora Khalil": "نورا",
  "Junior Soda": "چونيور صودا",
};

/** Resolve Arabic display name; falls back to the English name if unmapped. */
export function getTeamDisplayName(englishName: string, id?: string): string {
  if (id && BY_ID[id]) return BY_ID[id]!;
  return BY_ENGLISH_NAME[englishName] ?? englishName;
}
