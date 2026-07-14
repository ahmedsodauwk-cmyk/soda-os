/**
 * SODA Logo System — Official Brand Identity (Mission 06.3).
 *
 * Source of truth: `/public/brand/soda-logo-official.png`
 * White geometric Kufic SODA on black square.
 *
 * NEVER stretch, crop, recolor, filter, redraw, or re-vectorize the mark.
 * Derivatives are resize/compose only from the official file.
 */

export const SODA_LOGO = {
  /** Official black-square mark (canonical) */
  officialSrc: "/brand/soda-logo-official.png",
  /**
   * Splash / loading only — official mark with near-black plate removed
   * (white geometry preserved; no recolor). Derived from official PNG.
   */
  markTransparentSrc: "/brand/soda-logo-mark-transparent.png",
  /** Alias — same official mark */
  markWhiteSrc: "/brand/soda-mark-white.png",
  /** UI mark — same official mark (no alternate plate) */
  markSrc: "/brand/soda-mark.png",
  /** Wordmark placements use official mark + typed product name */
  wordmarkSrc: "/brand/soda-logo-official.png",
  /** Dark plate lockup — same official mark */
  masterSrc: "/brand/soda-logo-master.png",
  /** Favicon / app icon */
  iconSrc: "/brand/soda-icon.png",
  /** SVG wrapper (embeds official PNG — no re-trace) */
  svgSrc: "/brand/soda-logo.svg",
  /** Open Graph */
  ogSrc: "/brand/og-image.png",
  alt: "SODA",
  /** Sidebar / product word */
  productName: "SODA",
  /** Login / splash product line */
  systemTagline: "Visual Operating System",
  /** Sidebar second line (company) */
  studioTagline: "VISUALS",
  /** Official company display name */
  studioName: "SODA VISUALS",
  /** Full product lockup for docs / metadata */
  fullName: "SODA VISUALS",
  /** Asset revision — busts browser/PWA icon cache */
  assetVersion: "06.3.2",
} as const;

/** Recommended display sizes by placement (never upscale past source clarity) */
export const SODA_LOGO_SIZES = {
  sidebar: 32,
  favicon: 32,
  splash: 88,
  login: 96,
  document: 48,
  about: 64,
  empty: 28,
} as const;

export type SodaLogoPlacement =
  | "sidebar"
  | "favicon"
  | "splash"
  | "login"
  | "about"
  | "reports"
  | "pdf"
  | "empty";

/** Which asset + size to use per placement */
export const SODA_LOGO_PLACEMENTS: Record<
  SodaLogoPlacement,
  {
    src: string;
    size: number;
    showWord?: boolean;
    /** Square black mark — preserve hard corners */
    preserveSquare?: boolean;
    wordMode?: "studio" | "system";
  }
> = {
  sidebar: {
    src: SODA_LOGO.officialSrc,
    size: SODA_LOGO_SIZES.sidebar,
    showWord: true,
    wordMode: "studio",
    preserveSquare: true,
  },
  favicon: { src: SODA_LOGO.iconSrc, size: SODA_LOGO_SIZES.favicon, preserveSquare: true },
  splash: {
    src: SODA_LOGO.markTransparentSrc,
    size: SODA_LOGO_SIZES.splash,
    preserveSquare: true,
  },
  login: {
    src: SODA_LOGO.officialSrc,
    size: SODA_LOGO_SIZES.login,
    showWord: false,
    wordMode: "system",
    preserveSquare: true,
  },
  about: {
    src: SODA_LOGO.officialSrc,
    size: SODA_LOGO_SIZES.about,
    showWord: true,
    wordMode: "studio",
    preserveSquare: true,
  },
  reports: {
    src: SODA_LOGO.officialSrc,
    size: SODA_LOGO_SIZES.document,
    preserveSquare: true,
  },
  pdf: {
    src: SODA_LOGO.officialSrc,
    size: SODA_LOGO_SIZES.document,
    preserveSquare: true,
  },
  empty: {
    src: SODA_LOGO.officialSrc,
    size: SODA_LOGO_SIZES.empty,
    preserveSquare: true,
  },
};

/**
 * Future PDF header layout rules (consume in report exporters).
 */
export const SODA_PDF_HEADER = {
  markSizePx: SODA_LOGO_SIZES.document,
  clearSpaceRatio: 0.25,
  accentLine: true,
  accentColorToken: "soda-pink",
  productName: SODA_LOGO.fullName,
  tagline: SODA_LOGO.studioTagline,
} as const;

/** Append cache-bust query for browser / PWA icons */
export function sodaBrandUrl(path: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}v=${SODA_LOGO.assetVersion}`;
}
