# Supabase (Sprint 15)

Backend foundation only — domain repositories still use empty in-memory stores.

## Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.example` → `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Optional: `SUPABASE_SERVICE_ROLE_KEY` (server/admin only — never commit)
3. Apply the migration:
   - **Dashboard:** SQL Editor → paste `supabase/migrations/20260711000000_init.sql` → Run
   - **CLI:** `supabase link` then `supabase db push` (when CLI is installed)
4. Verify connectivity:
   ```bash
   npx tsx scripts/check-supabase.ts
   ```

## What this sprint does / does not

| Done | Not done |
|------|----------|
| Client helpers (`lib/supabase/*`) | Rewriting domain repositories |
| Empty schema (no INSERT seeds) | Auth / RLS policies |
| Health probe script | Live dual-read on pages |

App keeps working with empty mock stores whether or not Supabase env is set.
