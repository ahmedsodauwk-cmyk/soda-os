/**
 * SODA Official Design System — Sprint 11 token source of truth.
 *
 * CSS variables in `app/globals.css` are the runtime theme.
 * This module mirrors them for TS consumers (charts, docs, PDF, login).
 *
 * ─────────────────────────────────────────────────────────────
 * COLOR ROLES (Sprint 11 — calm premium)
 * ─────────────────────────────────────────────────────────────
 * Dark surfaces = primary foundation (void / charcoal cards)
 * White = readability on dark UI
 * Deep Dark Purple (#2D1B4E) = supporting brand (sidebar tint, mark field)
 * Vibrant Pink (#E93D77) = accent only
 *   CTAs, progress, selection, notifications, interactive highlights
 *
 * Do not flood purple across every surface — keep it supporting.
 */

export const sodaColors = {
  /** Deep Dark Purple — brand foundation (mark field, supporting tint) */
  purple: {
    50: "#F5F0FA",
    100: "#E8DEEF",
    200: "#C9B8D9",
    300: "#9A7FB3",
    400: "#6B4F8A",
    500: "#4A3568",
    /** Official foundation from brand lockup */
    600: "#2D1B4E",
    700: "#241640",
    800: "#1A1030",
    900: "#120B22",
    950: "#0A0714",
  },
  /**
   * Vibrant Pink — energy accents + primary actions only.
   * Official accent from brand lockup ≈ #E93D77
   */
  pink: {
    50: "#FDF2F7",
    100: "#FCE7F0",
    200: "#F9C2D9",
    300: "#F48BB8",
    400: "#EF5A96",
    /** Official accent */
    500: "#E93D77",
    600: "#D12A63",
    700: "#B01E52",
    800: "#8F1843",
    900: "#6E1234",
  },
  /** Neutrals / surfaces — dark foundation + white readability */
  ink: {
    white: "#FFFFFF",
    fog: "#F4F2F7",
    mist: "#C8C2D4",
    slate: "#8B8499",
    charcoal: "#16121F",
    void: "#0C0A12",
  },
} as const;

/** Semantic roles mapped to CSS custom properties */
export const sodaSemantic = {
  /** Supporting brand purple (not every surface) */
  primary: "var(--primary)",
  primaryForeground: "var(--primary-foreground)",
  /** Pink action fill for CTAs */
  action: "var(--soda-action)",
  actionForeground: "var(--soda-action-foreground)",
  accentPink: "var(--soda-pink)",
  accentPinkMuted: "var(--soda-pink-muted)",
  accentPinkSoft: "var(--soda-pink-soft)",
  ring: "var(--ring)",
  background: "var(--background)",
  foreground: "var(--foreground)",
  card: "var(--card)",
  sidebar: "var(--sidebar)",
  chart: [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ],
} as const;

/**
 * Type scale — English chrome (Outfit) + Arabic (Alexandria).
 * Arabic lines use `.font-ar` with stronger size/leading for readability.
 */
export const sodaType = {
  pageTitle: {
    en: "font-heading text-xl font-semibold tracking-tight sm:text-[1.65rem]",
    ar: "font-ar text-[0.9375rem] leading-[1.85] sm:text-base sm:leading-[1.8]",
  },
  sectionTitle: "font-heading text-base font-semibold tracking-tight",
  sectionWhisper:
    "font-ar text-[0.9375rem] leading-[1.8] text-muted-foreground sm:text-base sm:leading-[1.75]",
  body: "text-sm leading-relaxed",
  bodyAr: "font-ar text-[0.9375rem] leading-[1.8]",
  caption: "text-xs leading-relaxed text-muted-foreground",
  captionAr: "font-ar text-[13px] leading-[1.75] text-muted-foreground",
  kpiValue: "font-mono text-2xl font-semibold tracking-tight tabular-nums",
  heroAr:
    "font-ar text-[1.75rem] leading-[1.35] font-semibold tracking-tight sm:text-[2.05rem] sm:leading-[1.3]",
} as const;

/** Spacing rhythm (rem) */
export const sodaSpace = {
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
} as const;

/** Radius scale — mirrors CSS --radius* */
export const sodaRadius = {
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
  full: "9999px",
} as const;

/** Elevation — restrained; pink glow only for intentional accents */
export const sodaElevation = {
  none: "none",
  soft: "var(--soda-shadow-soft)",
  lift: "var(--soda-shadow-lift)",
  glow: "var(--soda-shadow-glow)",
  pinkGlow: "var(--soda-shadow-pink)",
} as const;

/** Motion — premium subtle */
export const sodaMotion = {
  fast: "120ms",
  base: "200ms",
  slow: "320ms",
  live: "480ms",
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

/** Status — readable, lightly brand-harmonized */
export const sodaStatus = {
  success: "oklch(0.72 0.15 155)",
  warning: "oklch(0.78 0.14 75)",
  danger: "oklch(0.68 0.19 25)",
  info: "oklch(0.72 0.12 250)",
} as const;

/**
 * Chart palette — dark purple foundation + pink accents.
 * chart-1/3/5 = purple family; chart-2/4 = pink energy.
 */
export const sodaChartPalette = [
  sodaColors.purple[400],
  sodaColors.pink[500],
  sodaColors.purple[300],
  sodaColors.pink[400],
  sodaColors.purple[600],
] as const;

/** Official lockup hex — use when hardcoding brand fills */
export const SODA_BRAND_HEX = {
  deepPurple: "#2D1B4E",
  vibrantPink: "#E93D77",
  white: "#FFFFFF",
} as const;
