/**
 * SODA Logo System — official extracted mark (RC2).
 *
 * Assets in `/public/brand/` (source of truth = lockup PNG extraction):
 * - `soda-mark-white.png` — white geometric mark only (transparent)
 * - `soda-mark.png` — white mark on Deep Purple tile
 * - `soda-icon.png` — app / favicon tile
 * - `soda-logo-master.png` — official lockup (pink field + purple + white)
 *
 * NEVER redraw, simplify, or re-vectorize the mark.
 * Colors from lockup: Deep Purple #2D1B4E · Brand Pink #E93D77 · White
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
  /** Primary mark — white on Deep Purple tile */
  markSrc: "/brand/soda-mark.png",
  /** White-only mark for dark overlays / splash */
  markWhiteSrc: "/brand/soda-mark-white.png",
  /** Same as mark for wordmark placements (word rendered in component) */
  wordmarkSrc: "/brand/soda-mark.png",
  /** Official master lockup PNG */
  masterSrc: "/brand/soda-logo-master.png",
  /** Favicon / app icon */
  iconSrc: "/brand/soda-icon.png",
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
  { src: string; size: number; showWord?: boolean; onDark?: boolean }
> = {
  sidebar: {
    src: SODA_LOGO.markSrc,
    size: SODA_LOGO_SIZES.sidebar,
    showWord: true,
  },
  favicon: { src: SODA_LOGO.iconSrc, size: SODA_LOGO_SIZES.favicon },
  splash: {
    src: SODA_LOGO.markSrc,
    size: SODA_LOGO_SIZES.splash,
  },
  login: {
    src: SODA_LOGO.markSrc,
    size: SODA_LOGO_SIZES.splash,
    showWord: true,
  },
  about: {
    src: SODA_LOGO.markSrc,
    size: SODA_LOGO_SIZES.about,
    showWord: true,
  },
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
