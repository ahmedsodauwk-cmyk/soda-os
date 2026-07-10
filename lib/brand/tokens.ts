/**
 * SODA Official Design System — token source of truth.
 *
 * CSS variables in `app/globals.css` are the runtime theme.
 * This module mirrors them for TS consumers (charts, docs, future PDF/login).
 *
 * Palette inspired by the SODA mark: Deep Purple (primary) + Vibrant Pink (accent).
 */

export const sodaColors = {
  /** Deep Purple — primary brand, CTAs, focus, sidebar active */
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
  /** Vibrant Pink — premium accent only (never flood the UI) */
  pink: {
    400: "#F472B6",
    500: "#EC4899",
    600: "#DB2777",
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
  primary: "var(--primary)",
  primaryForeground: "var(--primary-foreground)",
  accentPink: "var(--soda-pink)",
  accentPinkMuted: "var(--soda-pink-muted)",
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

/** Type scale — English chrome + Arabic supporting */
export const sodaType = {
  pageTitle: {
    en: "text-xl font-semibold tracking-tight sm:text-2xl",
    ar: "font-ar text-base leading-[1.8] sm:text-[1.0625rem] sm:leading-[1.75]",
  },
  sectionTitle: "text-base font-semibold tracking-tight",
  sectionWhisper: "font-ar text-sm leading-[1.75] text-muted-foreground",
  body: "text-sm leading-relaxed",
  caption: "text-xs leading-relaxed text-muted-foreground",
  kpiValue: "font-mono text-2xl font-semibold tracking-tight tabular-nums",
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
} as const;

/** Motion */
export const sodaMotion = {
  fast: "120ms",
  base: "200ms",
  slow: "320ms",
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

/** Status — readable, lightly brand-harmonized */
export const sodaStatus = {
  success: "oklch(0.72 0.15 155)",
  warning: "oklch(0.78 0.14 75)",
  danger: "oklch(0.68 0.19 25)",
  info: "oklch(0.72 0.12 250)",
} as const;

/** Chart palette (brand-aligned) for Recharts / future reports */
export const sodaChartPalette = [
  sodaColors.purple[400],
  sodaColors.pink[500],
  sodaColors.purple[300],
  sodaColors.pink[400],
  sodaColors.purple[600],
] as const;
