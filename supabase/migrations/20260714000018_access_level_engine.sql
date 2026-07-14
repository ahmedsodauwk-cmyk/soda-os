-- SODA VISUALS — Access Level Engine (Mission 04.4.5)
-- Safe to re-run (IF NOT EXISTS / ON CONFLICT / additive).
--
-- Access Level = authorization. Job title / role = work identity (never grants).
-- DOES NOT create Auth users, people, or demo accounts.
--
-- Production: paste into Supabase SQL Editor if not auto-applied.

-- ---------------------------------------------------------------------------
-- profiles.access_level
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists access_level text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_access_level_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_access_level_check
      check (
        access_level is null
        or access_level in (
          'founder',
          'account_manager',
          'team_leader',
          'team'
        )
      );
  end if;
end $$;

comment on column public.profiles.access_level is
  'Authorization tier: founder | account_manager | team_leader | team. Independent of job title / role.';

create index if not exists profiles_access_level_idx
  on public.profiles (access_level);

-- Backfill from legacy role — unknown → team (never elevate nulls to founder)
update public.profiles
set access_level = case
  when role in ('owner', 'founder', 'admin') then 'founder'
  when role in ('sales', 'customer_service') then 'account_manager'
  when role in ('team_leader', 'project_manager') then 'team_leader'
  else 'team'
end
where access_level is null;

-- Prefer NOT NULL for new rows after backfill
alter table public.profiles
  alter column access_level set default 'team';

-- ---------------------------------------------------------------------------
-- Access Level role templates (permission lookup keys = access_level ids)
-- ---------------------------------------------------------------------------
insert into public.roles (id, label, description) values
  (
    'founder',
    'Founder',
    'Full operational authority — Access Level Founder'
  ),
  (
    'account_manager',
    'Account Manager',
    'Quotations, orders, clients, commercial — no Authority / company finance / settings'
  ),
  (
    'team_leader',
    'Team Leader',
    'Orders, assign work, crew coordination — no Authority / finance / user creation'
  ),
  (
    'team',
    'Team',
    'Personal workspace only — no company management modules'
  )
on conflict (id) do update set
  label = excluded.label,
  description = excluded.description;

-- ---------------------------------------------------------------------------
-- Default role_permissions for Access Levels (idempotent)
-- ---------------------------------------------------------------------------

-- Founder: all permissions
insert into public.role_permissions (role_id, permission_id)
select 'founder', id from public.permissions
on conflict do nothing;

-- Account Manager
insert into public.role_permissions (role_id, permission_id)
select 'account_manager', x
from unnest(array[
  'dashboard.company',
  'orders.view', 'orders.create', 'orders.edit', 'orders.approve', 'orders.status',
  'projects.view',
  'clients.view', 'clients.edit', 'clients.manage',
  'work.assign',
  'calendar.view', 'calendar.edit',
  'quotations.view', 'quotations.edit',
  'commercial.view',
  'notifications.view'
]) as t(x)
where exists (select 1 from public.permissions p where p.id = x)
on conflict do nothing;

-- Team Leader
insert into public.role_permissions (role_id, permission_id)
select 'team_leader', x
from unnest(array[
  'dashboard.team',
  'orders.view', 'orders.create', 'orders.edit', 'orders.approve', 'orders.status',
  'projects.view', 'projects.edit',
  'crew.view', 'crew.stats', 'people.view',
  'work.assign',
  'clients.view',
  'calendar.view', 'calendar.edit', 'calendar.manage',
  'notifications.view',
  'me.performance'
]) as t(x)
where exists (select 1 from public.permissions p where p.id = x)
on conflict do nothing;

-- Team (personal workspace)
insert into public.role_permissions (role_id, permission_id)
select 'team', x
from unnest(array[
  'dashboard.crew',
  'orders.view', 'orders.status',
  'calendar.view',
  'notifications.view',
  'me.wallet', 'me.bonus', 'me.target', 'me.penalties',
  'me.files', 'me.briefs', 'me.dress_code', 'me.performance'
]) as t(x)
where exists (select 1 from public.permissions p where p.id = x)
on conflict do nothing;
