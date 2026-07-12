export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Cookie + localStorage key for UI language preference. */
export const LOCALE_COOKIE = "soda-locale";
export const LOCALE_STORAGE_KEY = "soda-visuals:locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: "🇺🇸",
  ar: "🇪🇬",
};

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "ar";
}

export function parseLocale(value: string | null | undefined): Locale {
  if (isLocale(value)) return value;
  return DEFAULT_LOCALE;
}
