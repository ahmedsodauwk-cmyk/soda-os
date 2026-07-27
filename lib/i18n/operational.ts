/**
 * English-first operational UI — system chrome stays English regardless of locale.
 * SODA Language (Arabic guidance) is separate via human-layer / SodaLanguage.
 */

import {
  getDictionary,
  getDictValue,
  type DictKey,
  type Dictionary,
} from "@/lib/i18n/dictionaries";

const EN_DICT: Dictionary = getDictionary("en");

/** Resolve an i18n key from the English operational dictionary. */
export function operationalT(key: DictKey): string {
  return getDictValue(EN_DICT, key);
}
