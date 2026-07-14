# SODA brand assets (Mission 06.3 — Official Identity)

## Single Source of Truth

**`soda-logo-official.png`** — exact attached white geometric Kufic SODA mark on black square.

- SHA256: `0A0AD57AE36ECA1D81DF4CED3D61F198F94F024587BC6B4122BB2607BF1712FB`
- Attachment source (Cursor assets copy of chat PNG)

Never stretch, crop incorrectly, recolor, filter, redesign, or re-vectorize.

| File | Role |
|------|------|
| `soda-logo-official.png` | Exact official attachment (black square) |
| `soda-mark-white.png` / `soda-logo.png` | Black plate → transparent (dark overlays) |
| `soda-mark.png` / `soda-mark-tile.png` / `soda-logo-master.png` | Scaled black-square derivatives |
| `soda-icon.png` / `pwa-192.png` / `pwa-512.png` | App / PWA icons |
| `favicon-32.png` / `favicon.ico` | Browser tab |
| `apple-touch-icon.png` | iOS home screen |
| `og-image.png` | Open Graph / social |
| `soda-logo.svg` | SVG wrapper embedding official PNG |

Cache bust via `?v=06.3.1` in `app/layout.tsx` and `manifest.webmanifest`.
