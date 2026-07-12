"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  THEME_COOKIE,
  THEME_STORAGE_KEY,
  parseTheme,
  resolveTheme,
  type ResolvedTheme,
  type Theme,
} from "@/lib/theme/config";

type ThemeContextValue = {
  theme: Theme;
  resolved: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyResolved(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

function persistTheme(theme: Theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
  document.cookie = `${THEME_COOKIE}=${theme};path=/;max-age=31536000;samesite=lax`;
}

const systemListeners = new Set<() => void>();

function subscribeSystem(listener: () => void) {
  systemListeners.add(listener);
  if (typeof window === "undefined") {
    return () => systemListeners.delete(listener);
  }
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    systemListeners.forEach((l) => l());
  };
  mq.addEventListener("change", onChange);
  return () => {
    systemListeners.delete(listener);
    mq.removeEventListener("change", onChange);
  };
}

function getSystemDarkSnapshot(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getServerSystemDarkSnapshot(): boolean {
  return true;
}

export function ThemeProvider({
  initialTheme = "system",
  children,
}: {
  initialTheme?: Theme;
  children: ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>(() =>
    parseTheme(initialTheme)
  );
  const systemDark = useSyncExternalStore(
    subscribeSystem,
    getSystemDarkSnapshot,
    getServerSystemDarkSnapshot
  );
  const resolved = resolveTheme(theme, systemDark);

  useEffect(() => {
    applyResolved(resolved);
  }, [resolved]);

  const setTheme = useCallback((next: Theme) => {
    const parsed = parseTheme(next);
    setThemeState(parsed);
    persistTheme(parsed);
    applyResolved(resolveTheme(parsed, getSystemDarkSnapshot()));
  }, []);

  const value = useMemo(
    () => ({ theme, resolved, setTheme }),
    [theme, resolved, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
