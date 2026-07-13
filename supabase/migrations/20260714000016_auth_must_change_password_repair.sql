-- SODA VISUALS — HOTFIX 04.4.2: Auth must_change_password repair (Production)
-- Safe to re-run (IF NOT EXISTS / CREATE OR REPLACE). Additive only.
--
-- Root cause: Authentication Brand Foundation (20260713000012) was never
-- applied on Production while later migrations (People OS / Authority) were.
-- App expects profiles.must_change_password + clear_must_change_password().
--
-- DOES NOT:
--   • modify Authority Engine objects
--   • create Auth users / demo data
--   • delete or rewrite existing business data
--   • replace handle_new_user (People OS owns that definition)
--
-- Founder apply path:
--   Supabase Dashboard → SQL Editor → paste this file → Run
--   Then reload PostgREST schema cache if column still 404s in API.

-- ---------------------------------------------------------------------------
-- Profiles: username + forced password change (temp-password flow)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists username text;

alter table public.profiles
  add column if not exists must_change_password boolean not null default false;

create unique index if not exists profiles_username_lower_uidx
  on public.profiles (lower(username))
  where username is not null and length(trim(username)) > 0;

-- Backfill username from email local-part where missing (idempotent)
update public.profiles
set username = lower(split_part(email, '@', 1))
where username is null
  and email is not null
  and position('@' in email) > 1;

-- ---------------------------------------------------------------------------
-- Clear must_change_password helper (matches lib/auth/actions.ts RPC usage)
-- ---------------------------------------------------------------------------
create or replace function public.clear_must_change_password()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  update public.profiles
  set must_change_password = false,
      updated_at = now()
  where id = auth.uid();
end;
$$;

revoke all on function public.clear_must_change_password() from public;
grant execute on function public.clear_must_change_password() to authenticated;
