/**
 * SODA Official Design System — brand token source of truth (RC2).
 *
 * CSS variables in `app/globals.css` are the runtime theme.
 * Hex values sampled from the official lockup PNG.
 *
 * Deep Purple #29194A · Brand Pink #D23B68 · White #FFFFFF
 * Surface mix target ≈30% purple / ≈30% pink / ≈30% white / ≈10% neutrals
 */

export const sodaColors = {
  purple: {
    50: "#F5F0FA",
    100: "#E8DEEF",
    200: "#C9B8D9",
    300: "#9A7FB3",
    400: "#6B4F8A",
    500: "#4A3568",
    600: "#29194A",
    700: "#1A1030",
    800: "#120B22",
    900: "#0A0712",
    950: "#06040C",
  },
  pink: {
    50: "#FDF2F7",
    100: "#F6D5E3",
    200: "#F0A8C4",
    300: "#E85A84",
    400: "#DB4570",
    500: "#D23B68",
    600: "#B82E58",
    700: "#9A1F4A",
    800: "#7A1840",
    900: "#5C1230",
  },
  ink: {
    white: "#FFFFFF",
    fog: "#F4EEF8",
    mist: "#C8C2D4",
    slate: "#5C536C",
    charcoal: "#160F24",
    void: "#0A0712",
  },
} as const;

export const sodaSemantic = {
  primary: "var(--primary)",
  primaryForeground: "var(--primary-foreground)",
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

export type SodaSectionPersonality =
  | "home"
  | "orders"
  | "projects"
  | "clients"
  | "commercial"
  | "finance"
  | "equipment"
  | "crew"
  | "statistics"
  | "settings"
  | "notifications"
  | "wedding"
  | "calendar"
  | "auth"
  | "default";

export function resolveSectionPersonality(
  layer: string
): SodaSectionPersonality {
  switch (layer) {
    case "dashboard":
      return "home";
    case "finance":
    case "myWallet":
    case "quotations":
    case "newQuotation":
      return "finance";
    case "orders":
    case "attention":
      return "orders";
    case "projects":
    case "projectHub":
      return "projects";
    case "clients":
      return "clients";
    case "calendar":
    case "schedule":
      return "calendar";
    case "commercial":
    case "commercialClients":
    case "commercialOrders":
    case "fashion":
    case "product":
    case "events":
    case "workspaces":
      return "commercial";
    case "weddings":
    case "weddingClients":
    case "weddingOrders":
      return "wedding";
    case "statistics":
      return "statistics";
    case "equipment":
      return "equipment";
    case "crew":
    case "crewProfile":
    case "people":
    case "peopleProfile":
    case "mySpace":
      return "crew";
    case "settings":
      return "settings";
    case "notifications":
      return "notifications";
    case "login":
    case "about":
      return "auth";
    default:
      return "default";
  }
}

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

export const sodaRadius = {
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
  full: "9999px",
} as const;

export const sodaElevation = {
  none: "none",
  soft: "var(--soda-shadow-soft)",
  lift: "var(--soda-shadow-lift)",
  glow: "var(--soda-shadow-glow)",
  pinkGlow: "var(--soda-shadow-pink)",
} as const;

export const sodaMotion = {
  fast: "120ms",
  base: "200ms",
  slow: "320ms",
  live: "480ms",
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

export const sodaStatus = {
  success: "oklch(0.72 0.15 155)",
  warning: "oklch(0.78 0.14 75)",
  danger: "oklch(0.68 0.19 25)",
  info: "oklch(0.72 0.12 250)",
} as const;

export const sodaChartPalette = [
  sodaColors.purple[600],
  sodaColors.pink[500],
  sodaColors.purple[400],
  sodaColors.pink[300],
  sodaColors.purple[500],
] as const;

export const SODA_BRAND_HEX = {
  deepPurple: "#29194A",
  brandPink: "#D23B68",
  vibrantPink: "#D23B68",
  white: "#FFFFFF",
} as const;
