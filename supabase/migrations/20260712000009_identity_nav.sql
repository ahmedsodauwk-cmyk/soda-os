-- SODA OS — Identity, Roles, Notifications & Navigation storage
-- Safe to re-run (IF NOT EXISTS / additive).
--
-- ONE AUTH ENABLE STEP (Dashboard):
--   Supabase → Authentication → Providers → Email → Enable Email provider.
--   (Required for login / forgot-password / invite email delivery.)
--
-- Paste this file into Supabase SQL Editor if the apply script cannot connect.

-- ---------------------------------------------------------------------------
-- Roles catalog (reference; app also enforces permissions in TypeScript)
-- ---------------------------------------------------------------------------
create table if not exists public.roles (
  id text primary key,
  label text not null,
  description text,
  created_at timestamptz not null default now()
);

insert into public.roles (id, label, description) values
  ('owner', 'Owner', 'Full company dashboard, finance, settings, users'),
  ('admin', 'Admin', 'Full ops except user invites'),
  ('team_leader', 'Team Leader', 'Team, orders, projects, calendar — no company finance'),
  ('crew_member', 'Crew Member', 'Personal workspace, wallet, calendar, assigned orders'),
  ('accountant', 'Accountant', 'Collections, payments, expenses, reports — no ops edit'),
  ('client', 'Client', 'Future client portal (limited)')
on conflict (id) do update set
  label = excluded.label,
  description = excluded.description;

-- ---------------------------------------------------------------------------
-- Permissions catalog
-- ---------------------------------------------------------------------------
create table if not exists public.permissions (
  id text primary key,
  label text not null,
  created_at timestamptz not null default now()
);

insert into public.permissions (id, label) values
  ('dashboard.company', 'Company dashboard'),
  ('dashboard.team', 'Team dashboard'),
  ('dashboard.crew', 'Crew dashboard'),
  ('dashboard.finance', 'Finance dashboard'),
  ('orders.view', 'View orders'),
  ('orders.edit', 'Edit orders'),
  ('projects.view', 'View projects'),
  ('projects.edit', 'Edit projects'),
  ('clients.view', 'View clients'),
  ('clients.edit', 'Edit clients'),
  ('crew.view', 'View crew'),
  ('crew.edit', 'Edit crew'),
  ('crew.stats', 'Crew stats'),
  ('equipment.view', 'View equipment'),
  ('equipment.edit', 'Edit equipment'),
  ('calendar.view', 'View calendar'),
  ('calendar.edit', 'Edit calendar'),
  ('finance.view', 'View finance'),
  ('finance.edit', 'Edit finance'),
  ('finance.reports', 'Finance reports'),
  ('quotations.view', 'View quotations'),
  ('quotations.edit', 'Edit quotations'),
  ('commercial.view', 'View commercial'),
  ('statistics.view', 'View statistics'),
  ('settings.view', 'View settings'),
  ('settings.users', 'Manage users'),
  ('notifications.view', 'View notifications'),
  ('me.wallet', 'My wallet'),
  ('me.bonus', 'My bonus'),
  ('me.target', 'My target'),
  ('me.penalties', 'My penalties'),
  ('me.files', 'My files'),
  ('me.briefs', 'My briefs'),
  ('me.dress_code', 'Dress code'),
  ('me.performance', 'My performance')
on conflict (id) do update set label = excluded.label;

create table if not exists public.role_permissions (
  role_id text not null references public.roles (id) on delete cascade,
  permission_id text not null references public.permissions (id) on delete cascade,
  primary key (role_id, permission_id)
);

-- Owner: all permissions
insert into public.role_permissions (role_id, permission_id)
select 'owner', id from public.permissions
on conflict do nothing;

-- Admin: all except settings.users
insert into public.role_permissions (role_id, permission_id)
select 'admin', id from public.permissions where id <> 'settings.users'
on conflict do nothing;

-- Team leader
insert into public.role_permissions (role_id, permission_id)
select 'team_leader', x
from unnest(array[
  'dashboard.team','orders.view','orders.edit','projects.view','projects.edit',
  'crew.view','crew.stats','calendar.view','calendar.edit','notifications.view',
  'me.performance'
]) as t(x)
on conflict do nothing;

-- Crew
insert into public.role_permissions (role_id, permission_id)
select 'crew_member', x
from unnest(array[
  'dashboard.crew','orders.view','calendar.view','notifications.view',
  'me.wallet','me.bonus','me.target','me.penalties','me.files','me.briefs',
  'me.dress_code','me.performance'
]) as t(x)
on conflict do nothing;

-- Accountant
insert into public.role_permissions (role_id, permission_id)
select 'accountant', x
from unnest(array[
  'dashboard.finance','finance.view','finance.reports','orders.view',
  'clients.view','notifications.view','statistics.view'
]) as t(x)
on conflict do nothing;

-- Client (future)
insert into public.role_permissions (role_id, permission_id)
values ('client', 'notifications.view')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'crew_member' references public.roles (id),
  person_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_person_id_idx on public.profiles (person_id);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Auto-create profile on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_role text;
  existing_count int;
  meta_role text;
begin
  select count(*) into existing_count from public.profiles;
  meta_role := coalesce(new.raw_user_meta_data->>'role', '');
  if existing_count = 0 then
    chosen_role := 'owner';
  elsif meta_role in ('owner','admin','team_leader','crew_member','accountant','client') then
    chosen_role := meta_role;
  else
    chosen_role := 'crew_member';
  end if;

  insert into public.profiles (id, email, full_name, role, is_active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    chosen_role,
    true
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Notifications storage (durable; app also hydrates from business_events)
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id text primary key,
  user_id uuid references auth.users (id) on delete cascade,
  event_id text,
  event_type text,
  title text not null,
  body text,
  href text,
  entity_type text,
  entity_id text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id or user_id is null);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Recently viewed / activity
-- ---------------------------------------------------------------------------
create table if not exists public.recent_activity (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  label text not null,
  href text not null,
  viewed_at timestamptz not null default now(),
  unique (user_id, entity_type, entity_id)
);

create index if not exists recent_activity_user_viewed_idx
  on public.recent_activity (user_id, viewed_at desc);

alter table public.recent_activity enable row level security;

drop policy if exists "recent_activity_own" on public.recent_activity;
create policy "recent_activity_own"
  on public.recent_activity for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.profiles to authenticated;
grant select on public.roles to authenticated, anon;
grant select on public.permissions to authenticated, anon;
grant select on public.role_permissions to authenticated, anon;
grant select, insert, update on public.notifications to authenticated;
grant select, insert, update, delete on public.recent_activity to authenticated;
grant usage, select on sequence public.recent_activity_id_seq to authenticated;

-- ---------------------------------------------------------------------------
-- Bootstrap gate (anon-readable): true when no active owner exists yet
-- ---------------------------------------------------------------------------
create or replace function public.bootstrap_needed()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles
    where role = 'owner' and is_active = true
  );
$$;

grant execute on function public.bootstrap_needed() to anon, authenticated;
