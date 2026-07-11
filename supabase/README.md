# Supabase (Sprint 15–16)

Backend foundation + connection activation. Domain repositories still use in-memory / mock stores until a later sprint wires them.

## Dashboard values → `.env.local`

1. Open **Supabase Dashboard → Project Settings → API**.
2. Copy into **`.env.local`** (same keys as `.env.example`):

| Dashboard value | `.env.local` key | Notes |
|-----------------|------------------|--------|
| **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` | e.g. `https://xxxx.supabase.co` |
| **anon public** key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Safe for browser / Next public env |
| **service_role** key (optional) | `SUPABASE_SERVICE_ROLE_KEY` | Server / migrations only. **Never** expose to the client or commit it. |

If `.env.local` is missing, copy `.env.example` → `.env.local` and replace the placeholders. Do not invent credentials.

## Apply migrations

Empty schema (no seed / demo rows):

1. `supabase/migrations/20260711000000_init.sql` — domain tables
2. `supabase/migrations/20260711000001_connection_tests.sql` — `_connection_tests` for smoke tests

**Options:**

- **Dashboard:** SQL Editor → paste each file → Run
- **CLI:** `supabase link` then `supabase db push` (when logged in)

## Verify

```bash
npm run supabase:health
```

This checks env (masked), API reachability, expected tables, and a reversible insert → read → delete on `_connection_tests`.

## What is / is not done

| Done | Not done |
|------|----------|
| Client helpers (`lib/supabase/*`) | Rewriting domain repositories to Postgres |
| Schema migrations (no INSERT seeds) | Auth / RLS policies |
| Health + read/write smoke script | Live dual-read on pages |

App keeps working with mock stores whether or not Supabase env is set.
