/**
 * SODA Logo System — Sprint 11 official usage rules.
 *
 * Assets in `/public/brand/`:
 * - `soda-mark.svg` — white geometric صودا on Deep Dark Purple (#2D1B4E)
 * - `soda-mark-white.svg` — white mark only (transparent) for dark UI overlays
 * - `soda-wordmark.svg` — mark + SODA VISUALS word
 * - `soda-logo-master.png` — official lockup master (source of truth)
 *
 * Colors: Deep Dark Purple #2D1B4E · Vibrant Pink #E93D77 · White
 *
 * ─────────────────────────────────────────────────────────────
 * PLACEMENTS (allowed)
 * ─────────────────────────────────────────────────────────────
 * ✓ Sidebar header (compact mark + “SODA VISUALS” word)
 * ✓ Favicon / app icon (mark only)
 * ✓ Loading overlay (mark, subtle pulse)
 * ✓ Login shell / About hero
 * ✓ Empty states (small mark, muted)
 * ✓ Future PDF letterhead / reports cover
 *
 * ─────────────────────────────────────────────────────────────
 * DO NOT
 * ─────────────────────────────────────────────────────────────
 * ✗ Repeat the logo inside every card / widget
 * ✗ Stretch, recolor arbitrarily, or crop the mark
 * ✗ Place the mark on busy photography without a dark scrim
 * ✗ Use pink as a full-bleed logo background (pink = accent only)
 *
 * Clear space: ≥ 0.25× mark height on all sides.
 */

export const SODA_LOGO = {
  /** Primary mark path (SVG) — purple tile + white صودا */
  markSrc: "/brand/soda-mark.svg",
  /** White-only mark for dark overlays */
  markWhiteSrc: "/brand/soda-mark-white.svg",
  /** Horizontal wordmark for splash / PDF */
  wordmarkSrc: "/brand/soda-wordmark.svg",
  /** Official master PNG */
  masterSrc: "/brand/soda-logo-master.png",
  /** Favicon / app icon */
  iconSrc: "/brand/soda-mark.svg",
  alt: "SODA VISUALS",
  /** Sidebar word line */
  productName: "SODA",
  studioTagline: "VISUALS",
  studioName: "SODA Visuals",
  /** Full product lockup for docs / metadata */
  fullName: "SODA VISUALS",
} as const;

/** Recommended pixel sizes by placement */
export const SODA_LOGO_SIZES = {
  /** Sidebar / mobile sheet */
  sidebar: 40,
  /** Favicon / PWA */
  favicon: 32,
  /** Loading / login hero */
  splash: 72,
  /** PDF / report header */
  document: 48,
  /** About page */
  about: 80,
  /** Empty-state watermark */
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
  { src: string; size: number; showWord?: boolean }
> = {
  sidebar: {
    src: SODA_LOGO.markSrc,
    size: SODA_LOGO_SIZES.sidebar,
    showWord: true,
  },
  favicon: { src: SODA_LOGO.iconSrc, size: SODA_LOGO_SIZES.favicon },
  splash: { src: SODA_LOGO.markSrc, size: SODA_LOGO_SIZES.splash },
  login: { src: SODA_LOGO.wordmarkSrc, size: SODA_LOGO_SIZES.splash },
  about: { src: SODA_LOGO.wordmarkSrc, size: SODA_LOGO_SIZES.about },
  reports: { src: SODA_LOGO.markSrc, size: SODA_LOGO_SIZES.document },
  pdf: { src: SODA_LOGO.markSrc, size: SODA_LOGO_SIZES.document },
  empty: { src: SODA_LOGO.markSrc, size: SODA_LOGO_SIZES.empty },
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
