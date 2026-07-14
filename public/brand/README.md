# SODA brand assets (Mission 06.3 — Official Identity)

## Source of truth

**`soda-logo-official.png`** — white geometric Kufic SODA on black square.

Never stretch, crop, recolor, filter, redraw, or re-vectorize.
All other files are resize / compose derivatives of this official mark.

| File | Role |
|------|------|
| `soda-logo-official.png` | Canonical official mark |
| `soda-mark.png` / `soda-mark-white.png` / `soda-logo.png` | Same mark (aliases) |
| `soda-mark-tile.png` / `soda-logo-master.png` | Same mark (lockup aliases) |
| `soda-icon.png` / `pwa-192.png` / `pwa-512.png` | App / PWA icons |
| `favicon-32.png` / `favicon.ico` | Browser tab |
| `apple-touch-icon.png` | iOS home screen |
| `og-image.png` | Open Graph / social |
| `soda-logo.svg` | SVG wrapper embedding official PNG |

## Colors (chrome around the mark — not of the mark)

| Role | Hex | Use |
|------|-----|-----|
| Deep Purple | `#29194A` | Auth / splash atmosphere only |
| Brand Pink | `#D23B68` | Actions / accent only |
| Black | `#000000` | Official mark plate |
| White | `#FFFFFF` | Official mark geometry |

Regenerate with: `node scripts/mission-06-3-generate-brand-assets.mjs`

Cache bust via `?v=06.3.1` on icon URLs in `app/layout.tsx` and `manifest.webmanifest`.
