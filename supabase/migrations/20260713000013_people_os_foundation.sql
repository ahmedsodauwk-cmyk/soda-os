-- SODA VISUALS — People OS foundation (Mission 04.4)
-- Safe to re-run (IF NOT EXISTS / ON CONFLICT / additive).
--
-- DOES NOT create Auth users, people/crew rows, or demo accounts.
-- Founder provides official crew list before any account provisioning.
--
-- Adds:
--   • people profile fields (display_name, department, emergency contact)
--   • Operational roles catalog (Founder-facing) — ADDITIVE to legacy roles
--     including social_media_manager; ensures legacy accountant exists
--   • permission_group metadata on permissions (architecture only — no UI)
--   • Permission catalog rows required by this migration's role_permissions
--     (people.*, orders.status, orders.finance, payments.*, expenses.*,
--      reports.view, social.*, plus identity keys assigned below)
--   • Default role_permissions for new / prepared roles (DB remains SoT)
--
-- TEMPORARY (Founder / Owner full grant):
--   Founder (and Owner refresh) currently receive ALL permissions.
--   Mission 04.4.1 — Founder Custom Permission Engine — will replace this
--   temporary grant-all with Founder-customizable role_permissions.

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
-- Permission grouping metadata (architecture only — no UI yet)
-- Future groups: Orders, Finance, People, Clients, Projects, Calendar,
-- Reports, Notifications, Social Media, Settings
-- ---------------------------------------------------------------------------
alter table public.permissions
  add column if not exists permission_group text;

comment on column public.permissions.permission_group is
  'Architecture grouping for future RBAC UI (Orders, Finance, People, Clients, Projects, Calendar, Reports, Notifications, Social Media, Settings). No UI yet.';

-- ---------------------------------------------------------------------------
-- Permission catalog — insert FIRST before any role_permissions below.
-- Self-contained: includes identity_nav keys this migration assigns, plus
-- People OS keys, orders.status / orders.finance, accountant surface keys
-- (payments.*, expenses.*, reports.view), and social.* for Social Media Mgr.
-- Production failed with 23503 when orders.status was absent from permissions.
-- ---------------------------------------------------------------------------
insert into public.permissions (id, label, permission_group) values
  -- Dashboards (misc / Settings-adjacent; keep under Settings or domain)
  ('dashboard.company', 'Company dashboard', 'Settings'),
  ('dashboard.team', 'Team dashboard', 'Settings'),
  ('dashboard.crew', 'Crew dashboard', 'Settings'),
  ('dashboard.finance', 'Finance dashboard', 'Finance'),
  -- Orders
  ('orders.view', 'View orders', 'Orders'),
  ('orders.edit', 'Edit orders', 'Orders'),
  ('orders.status', 'Update order operational status', 'Orders'),
  ('orders.finance', 'Edit order pricing / finance fields', 'Orders'),
  -- Projects
  ('projects.view', 'View projects', 'Projects'),
  ('projects.edit', 'Edit projects', 'Projects'),
  -- Clients
  ('clients.view', 'View clients', 'Clients'),
  ('clients.edit', 'Edit clients', 'Clients'),
  -- People / Crew
  ('crew.view', 'View crew', 'People'),
  ('crew.edit', 'Edit crew', 'People'),
  ('crew.stats', 'Crew stats', 'People'),
  ('people.view', 'View People OS directory and profiles', 'People'),
  ('people.edit', 'Edit People OS profiles', 'People'),
  -- Equipment (People-adjacent ops; no dedicated group yet → Settings)
  ('equipment.view', 'View equipment', 'Settings'),
  ('equipment.edit', 'Edit equipment', 'Settings'),
  -- Calendar
  ('calendar.view', 'View calendar', 'Calendar'),
  ('calendar.edit', 'Edit calendar', 'Calendar'),
  -- Finance / Payments / Expenses
  ('finance.view', 'View finance', 'Finance'),
  ('finance.edit', 'Edit finance', 'Finance'),
  ('finance.reports', 'Finance reports', 'Reports'),
  ('payments.view', 'View payments', 'Finance'),
  ('payments.edit', 'Edit payments', 'Finance'),
  ('expenses.view', 'View expenses', 'Finance'),
  ('expenses.edit', 'Edit expenses', 'Finance'),
  -- Reports
  ('reports.view', 'View reports', 'Reports'),
  ('statistics.view', 'View statistics', 'Reports'),
  -- Commercial / quotations (Clients-adjacent pipeline)
  ('quotations.view', 'View quotations', 'Clients'),
  ('quotations.edit', 'Edit quotations', 'Clients'),
  ('commercial.view', 'View commercial', 'Clients'),
  -- Social Media
  ('social.view', 'View social media workspace', 'Social Media'),
  ('social.edit', 'Edit social media content / schedule', 'Social Media'),
  -- Settings
  ('settings.view', 'View settings', 'Settings'),
  ('settings.users', 'Manage users', 'Settings'),
  -- Notifications
  ('notifications.view', 'View notifications', 'Notifications'),
  -- Personal workspace (People)
  ('me.wallet', 'My wallet', 'People'),
  ('me.bonus', 'My bonus', 'People'),
  ('me.target', 'My target', 'People'),
  ('me.penalties', 'My penalties', 'People'),
  ('me.files', 'My files', 'People'),
  ('me.briefs', 'My briefs', 'People'),
  ('me.dress_code', 'Dress code', 'People'),
  ('me.performance', 'My performance', 'People')
on conflict (id) do update set
  label = excluded.label,
  permission_group = excluded.permission_group;

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

-- Ensure legacy accountant exists (idempotent) before its role_permissions
insert into public.roles (id, label, description) values
  (
    'accountant',
    'Accountant',
    'Collections, payments, expenses, reports — no ops edit'
  )
on conflict (id) do update set
  label = excluded.label,
  description = excluded.description;

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
    'social_media_manager',
    'Social Media Manager',
    'Social media workspace, calendar, notifications — no finance / ops edit'
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

-- ---------------------------------------------------------------------------
-- TEMPORARY: grant all permissions to Founder (and refresh Owner).
-- Mission 04.4.1 will replace this with the Founder Custom Permission Engine.
-- Do NOT treat grant-all as the long-term RBAC model.
-- ---------------------------------------------------------------------------
insert into public.role_permissions (role_id, permission_id)
select 'founder', id from public.permissions
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select 'owner', id from public.permissions
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

-- Accountant (legacy role, prepared): Finance, Payments, Expenses, Reports
-- Maps existing finance.* / dashboard.finance / statistics.view plus new
-- payments.*, expenses.*, reports.view. No ops edit (orders.edit / projects.edit).
insert into public.role_permissions (role_id, permission_id)
select 'accountant', x
from unnest(array[
  'dashboard.finance',
  'finance.view', 'finance.edit', 'finance.reports',
  'payments.view', 'payments.edit',
  'expenses.view', 'expenses.edit',
  'reports.view', 'statistics.view',
  'orders.view',
  'clients.view',
  'notifications.view'
]) as t(x)
on conflict do nothing;

-- Social Media Manager — tight operational defaults (no finance / ops edit)
insert into public.role_permissions (role_id, permission_id)
select 'social_media_manager', x
from unnest(array[
  'social.view', 'social.edit',
  'calendar.view',
  'notifications.view',
  'projects.view',
  'orders.view'
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
    'social_media_manager', 'freelancer', 'guest'
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
