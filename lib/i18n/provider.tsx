"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  type Locale,
  parseLocale,
} from "@/lib/i18n/config";
import {
  getDictValue,
  getDictionary,
  type DictKey,
  type Dictionary,
} from "@/lib/i18n/dictionaries";

type I18nContextValue = {
  locale: Locale;
  dir: "ltr" | "rtl";
  dict: Dictionary;
  t: (key: DictKey) => string;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

/** Same-tab locale change subscribers (storage event is cross-tab only). */
const listeners = new Set<() => void>();

function emitLocaleChange() {
  listeners.forEach((listener) => listener());
}

function subscribeLocale(listener: () => void) {
  listeners.add(listener);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", listener);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", listener);
    }
  };
}

function persistLocale(locale: Locale) {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;samesite=lax`;
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
}

function readStoredLocale(fallback: Locale): Locale {
  try {
    return parseLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));
  } catch {
    return fallback;
  }
}

export function LocaleProvider({
  initialLocale = DEFAULT_LOCALE,
  children,
}: {
  initialLocale?: Locale;
  children: ReactNode;
}) {
  const locale = useSyncExternalStore(
    subscribeLocale,
    () => readStoredLocale(initialLocale),
    () => initialLocale
  );

  useLayoutEffect(() => {
    persistLocale(locale);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    persistLocale(next);
    emitLocaleChange();
  }, []);

  const dict = useMemo(() => getDictionary(locale), [locale]);
  const t = useCallback((key: DictKey) => getDictValue(dict, key), [dict]);
  const dir: "ltr" | "rtl" = locale === "ar" ? "rtl" : "ltr";

  const value = useMemo<I18nContextValue>(
    () => ({ locale, dir, dict, t, setLocale }),
    [locale, dir, dict, t, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within LocaleProvider");
  }
  return ctx;
}

/** Safe for optional chrome that may render outside provider during tests. */
export function useI18nOptional(): I18nContextValue | null {
  return useContext(I18nContext);
}
