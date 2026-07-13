-- SODA VISUALS — Operational Authority Engine (Mission 04.4.2)
-- Safe to re-run (IF NOT EXISTS / ON CONFLICT / additive).
--
-- DOES NOT create Auth users, people/crew rows, or demo accounts.
-- Accounts are provisioned ONLY from inside SODA OS by Founder/Admin.
--
-- Adds:
--   • Action-based permission catalog (create/approve/delete/manage)
--   • Permission group normalization (Crew, Commercial, …)
--   • Complete operational role templates (Admin refresh + all 04.4 roles)
--   • Default role_permissions for new action keys
--   • is_owner_or_admin includes founder
--
-- Production: paste into Supabase SQL Editor if not auto-applied.

-- ---------------------------------------------------------------------------
-- Permission catalog — insert FIRST before role_permissions
-- ---------------------------------------------------------------------------
insert into public.permissions (id, label, permission_group) values
  -- Action-based Orders
  ('orders.create', 'Create order', 'Orders'),
  ('orders.approve', 'Approve order', 'Orders'),
  ('orders.delete', 'Delete order', 'Orders'),
  -- Action-based Finance
  ('expenses.create', 'Create expense', 'Finance'),
  ('payments.approve', 'Approve payment', 'Finance'),
  -- Action-based Crew / ops
  ('work.assign', 'Assign work', 'Crew'),
  ('crew.manage', 'Manage crew accounts & roster', 'Crew'),
  -- Clients / Calendar / Reports / Social
  ('clients.manage', 'Manage clients', 'Clients'),
  ('calendar.manage', 'Manage calendar', 'Calendar'),
  ('reports.manage', 'Manage reports', 'Reports'),
  ('content.publish', 'Publish content', 'Social Media'),
  -- Ensure finance/social/reports keys exist (idempotent with 000013)
  ('payments.view', 'View payments', 'Finance'),
  ('payments.edit', 'Edit payments', 'Finance'),
  ('expenses.view', 'View expenses', 'Finance'),
  ('expenses.edit', 'Edit expenses', 'Finance'),
  ('reports.view', 'View reports', 'Reports'),
  ('social.view', 'View social media workspace', 'Social Media'),
  ('social.edit', 'Edit social media content / schedule', 'Social Media')
on conflict (id) do update set
  label = excluded.label,
  permission_group = excluded.permission_group;

-- Normalize groups: People → Crew; Commercial keys → Commercial
update public.permissions
set permission_group = 'Crew'
where permission_group = 'People'
   or id in (
     'crew.view', 'crew.edit', 'crew.stats',
     'people.view', 'people.edit',
     'me.wallet', 'me.bonus', 'me.target', 'me.penalties',
     'me.files', 'me.briefs', 'me.dress_code', 'me.performance'
   );

update public.permissions
set permission_group = 'Commercial'
where id in ('commercial.view', 'quotations.view', 'quotations.edit');

comment on column public.permissions.permission_group is
  'RBAC UI grouping: Orders, Finance, Crew, Clients, Projects, Calendar, Reports, Notifications, Commercial, Settings, Social Media';

-- ---------------------------------------------------------------------------
-- Role templates (complete operational catalog)
-- ---------------------------------------------------------------------------
insert into public.roles (id, label, description) values
  (
    'owner',
    'Owner',
    'Legacy full-control key — equivalent to Founder for existing profiles'
  ),
  (
    'admin',
    'Admin',
    'Studio operations manager — Authority Center access; no order finance by default'
  ),
  (
    'team_leader',
    'Team Leader',
    'Legacy project lead — prefer Project Manager for new accounts'
  ),
  (
    'crew_member',
    'Crew Member',
    'Legacy craft role — prefer Photographer / Videographer / Editors'
  ),
  (
    'accountant',
    'Accountant',
    'Collections, payments, expenses, reports — no ops edit'
  ),
  (
    'client',
    'Client',
    'External client portal (notifications until Founder expands)'
  ),
  (
    'founder',
    'Founder',
    'SODA VISUALS Founder — full operational authority; customizable via Authority Center'
  ),
  (
    'project_manager',
    'Project Manager',
    'Projects, orders, crew coordination — no company user invites by default'
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
    'social_media_manager',
    'Social Media Manager',
    'Social media workspace, calendar, publish content — no finance / ops edit'
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

-- ---------------------------------------------------------------------------
-- Default role_permissions for new action keys
-- ---------------------------------------------------------------------------

-- Founder + Owner: all permissions (refresh)
insert into public.role_permissions (role_id, permission_id)
select 'founder', id from public.permissions
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select 'owner', id from public.permissions
on conflict do nothing;

-- Admin: all except orders.finance (Founder may revoke settings.users anytime)
insert into public.role_permissions (role_id, permission_id)
select 'admin', id from public.permissions
where id not in ('orders.finance')
on conflict do nothing;

-- Project Manager / Team Leader — order create + assign work
insert into public.role_permissions (role_id, permission_id)
select r.role_id, x
from (values ('project_manager'), ('team_leader')) as r(role_id)
cross join unnest(array[
  'orders.create', 'orders.approve', 'work.assign', 'crew.manage',
  'calendar.manage', 'clients.manage'
]) as t(x)
on conflict do nothing;

-- Sales — create order / manage clients
insert into public.role_permissions (role_id, permission_id)
select 'sales', x
from unnest(array[
  'orders.create', 'clients.manage'
]) as t(x)
on conflict do nothing;

-- Accountant — create expense / approve payment / manage reports
insert into public.role_permissions (role_id, permission_id)
select 'accountant', x
from unnest(array[
  'expenses.create', 'payments.approve', 'payments.view', 'payments.edit',
  'expenses.view', 'expenses.edit', 'reports.view', 'reports.manage',
  'finance.edit'
]) as t(x)
on conflict do nothing;

-- Social Media Manager — publish + view/edit social
insert into public.role_permissions (role_id, permission_id)
select 'social_media_manager', x
from unnest(array[
  'social.view', 'social.edit', 'content.publish',
  'calendar.view', 'notifications.view',
  'projects.view', 'orders.view'
]) as t(x)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Founder in is_owner_or_admin (Authority Center / RLS)
-- ---------------------------------------------------------------------------
create or replace function public.is_owner_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('owner', 'founder', 'admin')
      and is_active = true
  );
$$;

revoke all on function public.is_owner_or_admin() from public;
grant execute on function public.is_owner_or_admin() to authenticated;
