/**
 * Theme foundation — Light / Dark / System.
 * Soft brand: White · Deep Purple · Pink accent (tokens in globals.css).
 */

export const THEME_COOKIE = "soda-theme";
export const THEME_STORAGE_KEY = "soda-visuals:theme";

export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];
export type ResolvedTheme = "light" | "dark";

export function parseTheme(raw: string | null | undefined): Theme {
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return "system";
}

export function resolveTheme(
  theme: Theme,
  systemPrefersDark: boolean
): ResolvedTheme {
  if (theme === "light") return "light";
  if (theme === "dark") return "dark";
  return systemPrefersDark ? "dark" : "light";
}

/** Inline script — apply theme before paint to avoid flash. */
export function themeBootScript(cookieName = THEME_COOKIE): string {
  return `(function(){try{var c="${cookieName}=";var m=document.cookie.split(";").map(function(s){return s.trim()}).find(function(s){return s.indexOf(c)===0});var t=m?decodeURIComponent(m.slice(c.length)):null;if(t!=="light"&&t!=="dark"&&t!=="system"){try{t=localStorage.getItem("${THEME_STORAGE_KEY}")}catch(e){t=null}}if(t!=="light"&&t!=="dark"&&t!=="system")t="system";var dark=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var root=document.documentElement;root.classList.toggle("dark",dark);root.style.colorScheme=dark?"dark":"light";}catch(e){}})();`;
}
