-- SODA VISUALS — People OS foundation (Mission 04.4)
-- Safe to re-run (IF NOT EXISTS / ON CONFLICT / additive).
--
-- DOES NOT create Auth users, people/crew rows, or demo accounts.
-- Founder provides official crew list before any account provisioning.
--
-- Adds:
--   • people profile fields (display_name, department, emergency contact)
--   • Operational roles catalog (Founder-facing) — ADDITIVE to legacy roles
--   • Permission catalog rows required by this migration's role_permissions
--     (people.*, orders.status, orders.finance, plus identity keys assigned below)
--   • Default role_permissions for new roles (DB remains SoT)

-- ---------------------------------------------------------------------------
-- People profile fields (HR / operational identity)
-- ---------------------------------------------------------------------------
alter table public.people
  add column if not exists display_name text;

alter table public.people
  add column if not exists department text;

alter table public.people
  add column if not exists emergency_contact_name text;

alter table public.people
  add column if not exists emergency_contact_phone text;

comment on column public.people.display_name is 'Studio display name (nickname-style); may differ from legal name_en';
comment on column public.people.department is 'Department / desk (e.g. Photo, Video, Ops)';
comment on column public.people.emergency_contact_name is 'Emergency contact full name';
comment on column public.people.emergency_contact_phone is 'Emergency contact phone';

-- ---------------------------------------------------------------------------
-- Permission catalog — insert FIRST before any role_permissions below.
-- Self-contained: includes identity_nav keys this migration assigns, plus
-- People OS keys and orders.status / orders.finance (also in 000010 / 000012).
-- Production failed with 23503 when orders.status was absent from permissions.
-- ---------------------------------------------------------------------------
insert into public.permissions (id, label) values
  ('dashboard.company', 'Company dashboard'),
  ('dashboard.team', 'Team dashboard'),
  ('dashboard.crew', 'Crew dashboard'),
  ('orders.view', 'View orders'),
  ('orders.edit', 'Edit orders'),
  ('orders.status', 'Update order operational status'),
  ('orders.finance', 'Edit order pricing / finance fields'),
  ('projects.view', 'View projects'),
  ('projects.edit', 'Edit projects'),
  ('clients.view', 'View clients'),
  ('clients.edit', 'Edit clients'),
  ('crew.view', 'View crew'),
  ('crew.edit', 'Edit crew'),
  ('crew.stats', 'Crew stats'),
  ('people.view', 'View People OS directory and profiles'),
  ('people.edit', 'Edit People OS profiles'),
  ('calendar.view', 'View calendar'),
  ('calendar.edit', 'Edit calendar'),
  ('quotations.view', 'View quotations'),
  ('quotations.edit', 'Edit quotations'),
  ('commercial.view', 'View commercial'),
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

-- Grant people.* to every role that already has matching crew.*
insert into public.role_permissions (role_id, permission_id)
select rp.role_id, 'people.view'
from public.role_permissions rp
where rp.permission_id = 'crew.view'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select rp.role_id, 'people.edit'
from public.role_permissions rp
where rp.permission_id = 'crew.edit'
on conflict do nothing;

-- Owner/admin always get people.* (in case crew.* mapping was empty)
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join (values ('people.view'), ('people.edit')) as p(id)
where r.id in ('owner', 'admin')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Operational roles (additive — keep owner, admin, team_leader, crew_member,
-- accountant, client as legacy keys for existing profiles)
-- ---------------------------------------------------------------------------
insert into public.roles (id, label, description) values
  (
    'founder',
    'Founder',
    'SODA VISUALS Founder — full control; permissions Founder-customizable'
  ),
  (
    'project_manager',
    'Project Manager',
    'Projects, orders, crew coordination — no company user invites'
  ),
  (
    'photographer',
    'Photographer',
    'Photography crew — personal workspace, assigned orders, wallet'
  ),
  (
    'videographer',
    'Videographer',
    'Videography crew — personal workspace, assigned orders, wallet'
  ),
  (
    'photo_editor',
    'Photo Editor',
    'Photo post-production crew member'
  ),
  (
    'video_editor',
    'Video Editor',
    'Video post-production crew member'
  ),
  (
    'sales',
    'Sales',
    'Quotations, clients, commercial pipeline'
  ),
  (
    'customer_service',
    'Customer Service',
    'Client relationships and order visibility'
  ),
  (
    'freelancer',
    'Freelancer',
    'External crew — personal workspace surfaces'
  ),
  (
    'guest',
    'Guest',
    'Limited guest access (notifications only until Founder expands)'
  )
on conflict (id) do update set
  label = excluded.label,
  description = excluded.description;

-- Founder: all permissions (same class as owner)
insert into public.role_permissions (role_id, permission_id)
select 'founder', id from public.permissions
on conflict do nothing;

-- Project Manager ≈ team_leader + people.view + crew visibility
insert into public.role_permissions (role_id, permission_id)
select 'project_manager', x
from unnest(array[
  'dashboard.team',
  'orders.view', 'orders.edit', 'orders.status',
  'projects.view', 'projects.edit',
  'crew.view', 'crew.stats', 'people.view',
  'calendar.view', 'calendar.edit',
  'notifications.view',
  'me.performance'
]) as t(x)
on conflict do nothing;

-- Craft roles ≈ crew_member
insert into public.role_permissions (role_id, permission_id)
select r.role_id, x
from (values
  ('photographer'),
  ('videographer'),
  ('photo_editor'),
  ('video_editor'),
  ('freelancer')
) as r(role_id)
cross join unnest(array[
  'dashboard.crew',
  'orders.view', 'orders.status',
  'calendar.view',
  'notifications.view',
  'me.wallet', 'me.bonus', 'me.target', 'me.penalties',
  'me.files', 'me.briefs', 'me.dress_code', 'me.performance'
]) as t(x)
on conflict do nothing;

-- Sales
insert into public.role_permissions (role_id, permission_id)
select 'sales', x
from unnest(array[
  'dashboard.company',
  'orders.view',
  'projects.view',
  'clients.view', 'clients.edit',
  'quotations.view', 'quotations.edit',
  'commercial.view',
  'calendar.view',
  'notifications.view'
]) as t(x)
on conflict do nothing;

-- Customer Service
insert into public.role_permissions (role_id, permission_id)
select 'customer_service', x
from unnest(array[
  'orders.view',
  'clients.view',
  'projects.view',
  'calendar.view',
  'notifications.view'
]) as t(x)
on conflict do nothing;

-- Guest ≈ client
insert into public.role_permissions (role_id, permission_id)
values ('guest', 'notifications.view')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- handle_new_user: accept new operational role keys from metadata
-- (still does not invent business people rows)
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
  chosen_username text;
  force_pw boolean;
begin
  select count(*) into existing_count from public.profiles;
  meta_role := coalesce(new.raw_user_meta_data->>'role', '');
  if existing_count = 0 then
    chosen_role := 'owner';
  elsif meta_role in (
    'owner', 'admin', 'team_leader', 'crew_member', 'accountant', 'client',
    'founder', 'project_manager', 'photographer', 'videographer',
    'photo_editor', 'video_editor', 'sales', 'customer_service',
    'freelancer', 'guest'
  ) then
    chosen_role := meta_role;
  else
    chosen_role := 'crew_member';
  end if;

  chosen_username := lower(coalesce(
    nullif(trim(new.raw_user_meta_data->>'username'), ''),
    split_part(coalesce(new.email, ''), '@', 1)
  ));

  force_pw := coalesce((new.raw_user_meta_data->>'must_change_password')::boolean, false);

  insert into public.profiles (
    id, email, full_name, role, is_active, username, must_change_password
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    chosen_role,
    true,
    nullif(chosen_username, ''),
    force_pw
  )
  on conflict (id) do update set
    email = excluded.email,
    username = coalesce(public.profiles.username, excluded.username),
    updated_at = now();

  return new;
end;
$$;
