export {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_FLAGS,
  LOCALE_LABELS,
  LOCALE_STORAGE_KEY,
  isLocale,
  parseLocale,
  type Locale,
} from "@/lib/i18n/config";

export {
  dictionaries,
  getDictionary,
  getDictValue,
  type Dictionary,
  type DictKey,
} from "@/lib/i18n/dictionaries";

export { LocaleProvider, useI18n, useI18nOptional } from "@/lib/i18n/provider";
