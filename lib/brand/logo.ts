/**
 * SODA Logo System — Experience v1.0 official usage rules.
 *
 * Asset: `/public/brand/soda-mark.svg` (primary mark)
 * Fallback wordmark: `/public/brand/soda-wordmark.svg`
 *
 * Inspired by Deep Purple + Vibrant Pink brand language.
 *
 * ─────────────────────────────────────────────────────────────
 * PLACEMENTS (allowed)
 * ─────────────────────────────────────────────────────────────
 * ✓ Sidebar header (compact mark + “SODA OS” word)
 * ✓ Favicon / app icon (mark only)
 * ✓ Loading overlay (mark, subtle pulse)
 * ✓ Login shell / About hero
 * ✓ Empty states (small mark, muted)
 * ✓ Future PDF letterhead / reports cover
 *
 * ─────────────────────────────────────────────────────────────
 * PDF / DOCUMENT HEADER (future)
 * ─────────────────────────────────────────────────────────────
 * • Mark size: SODA_LOGO_SIZES.document (48px) at top-start
 * • Clear space: ≥ 0.25× mark height on all sides
 * • Wordmark optional beside mark; product name “SODA OS” in Outfit
 * • Do not recolor the mark; print on white or deep-purple field only
 * • Pink accent line (1–2pt) under header is allowed; never flood pink
 * • Footer may use mark at 24px + studio tagline; no drop shadows
 *
 * ─────────────────────────────────────────────────────────────
 * DO NOT
 * ─────────────────────────────────────────────────────────────
 * ✗ Repeat the logo inside every card / widget
 * ✗ Stretch, recolor arbitrarily, or add drop shadows on the mark
 * ✗ Place the mark on busy photography without a dark scrim
 * ✗ Use pink as a full-bleed logo background (pink = accent only)
 *
 * Clear space: ≥ 0.25× mark height on all sides.
 */

export const SODA_LOGO = {
  /** Primary mark path (SVG) */
  markSrc: "/brand/soda-mark.svg",
  /** Horizontal wordmark for splash / PDF (future) */
  wordmarkSrc: "/brand/soda-wordmark.svg",
  /** Favicon / app icon */
  iconSrc: "/brand/soda-mark.svg",
  alt: "SODA",
  productName: "SODA OS",
  studioTagline: "Visuals Studio",
  studioName: "SODA Visuals Studio",
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

/** Which asset + size to use per placement — future-ready constants */
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
 * No runtime PDF generation yet — constants only.
 */
export const SODA_PDF_HEADER = {
  markSizePx: SODA_LOGO_SIZES.document,
  clearSpaceRatio: 0.25,
  accentLine: true,
  accentColorToken: "soda-pink",
  productName: SODA_LOGO.productName,
  tagline: SODA_LOGO.studioTagline,
} as const;
