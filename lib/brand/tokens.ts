/**
 * SODA Official Design System — Experience v1.0 token source of truth.
 *
 * CSS variables in `app/globals.css` are the runtime theme.
 * This module mirrors them for TS consumers (charts, docs, PDF, login).
 *
 * ─────────────────────────────────────────────────────────────
 * COLOR ROLES (Experience v1.0)
 * ─────────────────────────────────────────────────────────────
 * Purple = premium foundation
 *   surfaces, sidebar rail, cards, focus rings, chart base, brand shell
 * Pink = energy accents (intentional, not rainbow)
 *   primary action fill (CTAs), progress bars, selection highlight,
 *   chart accents, notification badges, active-nav pink edge,
 *   LIVE card accents, small highlights
 * Neutrals = ink / fog / mist for readable hierarchy
 *
 * Primary buttons lean pink via `--soda-action` while purple remains
 * the surface/sidebar/foundation language.
 */

export const sodaColors = {
  /** Deep Purple — foundation, surfaces, sidebar, brand shell */
  purple: {
    50: "#F5F0FF",
    100: "#E8DEFF",
    200: "#D0BDFF",
    300: "#B08FFF",
    400: "#9461F8",
    500: "#7C3AED",
    600: "#6B21A8",
    700: "#581C87",
    800: "#3B0764",
    900: "#2E0A4E",
    950: "#1A0530",
  },
  /**
   * Vibrant Pink — energy accents + primary actions.
   * Expanded scale for highlights, progress, selection, charts.
   */
  pink: {
    50: "#FDF2F8",
    100: "#FCE7F3",
    200: "#FBCFE8",
    300: "#F9A8D4",
    400: "#F472B6",
    500: "#EC4899",
    600: "#DB2777",
    700: "#BE185D",
    800: "#9D174D",
    900: "#831843",
  },
  /** Neutrals / surfaces */
  ink: {
    white: "#FFFFFF",
    fog: "#F4F2F7",
    mist: "#C8C2D4",
    slate: "#8B8499",
    charcoal: "#1C1626",
    void: "#0E0B14",
  },
} as const;

/** Semantic roles mapped to CSS custom properties */
export const sodaSemantic = {
  /** Purple foundation (surfaces, sidebar active fill) */
  primary: "var(--primary)",
  primaryForeground: "var(--primary-foreground)",
  /** Pink-leaning action fill for CTAs */
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
 * Type scale — English chrome (Outfit) + Arabic supporting (IBM Plex Sans Arabic).
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

/** Elevation */
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
 * Chart palette — purple foundation + pink accents.
 * chart-1/3/5 = purple family; chart-2/4 = pink energy.
 */
export const sodaChartPalette = [
  sodaColors.purple[400],
  sodaColors.pink[500],
  sodaColors.purple[300],
  sodaColors.pink[400],
  sodaColors.purple[600],
] as const;
