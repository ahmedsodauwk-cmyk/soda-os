# Access Level Engine — Production SQL (Mission 04.4.5)

If Vercel / linked Supabase did not apply migrations automatically, paste the contents of:

`supabase/migrations/20260714000018_access_level_engine.sql`

into the **Supabase SQL Editor** (Production project) and run once.

## What it does

- Adds `profiles.access_level` (`founder | account_manager | team_leader | team`)
- Backfills from legacy `role` (unknown → `team`, never invents Founder for nulls)
- Seeds Access Level permission templates in `roles` / `role_permissions`

## After apply

- Team-level accounts must **not** see Finance, Authority, or Settings admin
- Founder can change Access Level in Authority Center or Crew Workspace Account section
- Job Title never grants permissions

## Founder-nav leak (fixed in app)

Root cause: `mapProfileRow` defaulted unresolved `role` to **owner**, and soft session fallbacks granted Founder nav. Production now denies unresolved auth and resolves grants only via Access Level.
