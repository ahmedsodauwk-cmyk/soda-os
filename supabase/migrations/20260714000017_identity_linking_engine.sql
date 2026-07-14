-- SODA VISUALS — Mission 04.4.3: Identity Linking Engine (Production)
-- Safe to re-run (IF NOT EXISTS / additive only).
--
-- Enforces one crew member ↔ one profile/auth user.
-- DOES NOT create Auth users, crew rows, or demo data.

-- ---------------------------------------------------------------------------
-- profiles.person_id — one-to-one with people (crew SoT)
-- ---------------------------------------------------------------------------
create unique index if not exists profiles_person_id_uidx
  on public.profiles (person_id)
  where person_id is not null and length(trim(person_id)) > 0;

-- ---------------------------------------------------------------------------
-- Last password reset timestamp (Authority + Crew Workspace Account section)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists password_reset_at timestamptz;

comment on column public.profiles.password_reset_at is
  'Set when Founder issues a temporary password; shown in Crew Account section.';
