# SODA VISUALS

**Product:** SODA OS — operating system for SODA VISUALS production work.  
**Production:** https://soda-os.vercel.app  

**Founder Data Policy:** Production data is sacred — read `docs/SODA_MASTER/FOUNDER_DATA_POLICY.md` before writing to Supabase or running smoke scripts.

**Auth architecture:** `docs/SODA_MASTER/AUTH_ARCHITECTURE.md` — do not create demo/seed users; wait for the Founder’s official crew list.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Brand

Official company name: **SODA VISUALS**  
Never use: SODA Studio, or branding derived from “Studio”.

## Source protection (Founder)

GitHub is not the only source. The Founder PC holds the primary recovery tree (`D:\SODA OS\`). Details: `docs/SODA_MASTER/SOURCE_PROTECTION.md`.

```bash
npm run backup:source          # Create Source Snapshot → Exports/ or D:\SODA OS\Versions
npm run backup:database        # Database snapshot → D:\SODA OS\Database (or Exports/Database)
npm run backup:storage         # Storage snapshot → D:\SODA OS\Storage (or Exports/Storage)
npm run founder:local-dirs     # Create D:\SODA OS\ folders when that drive exists
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- **Master Project State (official SoT):** `docs/SODA_MASTER/SODA_OS_MASTER_PROJECT_STATE.md`
- SODA MASTER docs under `docs/SODA_MASTER/`
- Source protection: `docs/SODA_MASTER/SOURCE_PROTECTION.md`

## Deploy on Vercel

Production deploys from `main` to https://soda-os.vercel.app
