# SODA brand assets (PATCH 06.3.3 — Unified Identity)

## Source of truth

**`soda-logo.png`** — white geometric Kufic SODA, transparent RGBA (no black plate).

Never stretch, crop, recolor, filter, redraw, re-vectorize, or replace this master with a JPEG / opaque black-plate fake.

All other raster files are resize / compose-only derivatives from this master.

| File | Role |
|------|------|
| `soda-logo.png` | Canonical official mark (transparent RGBA) |
| `soda-icon.png` / `pwa-192.png` / `pwa-512.png` | App / PWA icons |
| `favicon-32.png` / `favicon.ico` | Browser tab |
| `apple-touch-icon.png` | iOS home screen |
| `og-image.png` | Open Graph / social (mark composited on dark plate) |
| `soda-logo.svg` | SVG wrapper embedding master PNG |

## Colors (chrome around the mark — not of the mark)

| Role | Hex | Use |
|------|-----|-----|
| Deep Purple | `#29194A` | Auth / splash atmosphere only |
| Brand Pink | `#D23B68` | Actions / accent only |
| White | `#FFFFFF` | Official mark geometry |

UI placements resolve through `lib/brand/logo.ts` → `SODA_LOGO.src`.
Cache bust via `SODA_LOGO.assetVersion` (`sodaBrandUrl`) in `app/layout.tsx` and `manifest.webmanifest`.

`scripts/extract-soda-mark.mjs` and `scripts/finalize-brand-assets.mjs` are deprecated stubs and must not be used.
