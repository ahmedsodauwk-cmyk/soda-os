/**
 * SODA Logo System — official usage rules.
 *
 * Asset: `/public/brand/soda-mark.svg` (primary mark)
 * Fallback wordmark: `/public/brand/soda-wordmark.svg`
 *
 * Inspired by Deep Purple + Vibrant Pink brand language.
 * Replace SVGs with the final studio lockup when available — paths stay stable.
 *
 * ─────────────────────────────────────────────────────────────
 * PLACEMENTS (allowed)
 * ─────────────────────────────────────────────────────────────
 * ✓ Sidebar header (compact mark + “SODA OS” word)
 * ✓ Favicon / app icon (mark only)
 * ✓ Future: loading splash, login, about, PDF letterhead, reports cover
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
} as const;

/** Recommended pixel sizes by placement */
export const SODA_LOGO_SIZES = {
  /** Sidebar / mobile sheet */
  sidebar: 36,
  /** Favicon / PWA */
  favicon: 32,
  /** Future loading / login hero */
  splash: 72,
  /** Future PDF / report header */
  document: 48,
  /** About page (future) */
  about: 64,
} as const;

export type SodaLogoPlacement =
  | "sidebar"
  | "favicon"
  | "splash"
  | "login"
  | "about"
  | "reports"
  | "pdf";

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
};
