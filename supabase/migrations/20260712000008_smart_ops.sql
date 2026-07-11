-- SODA OS — Smart Operations Engine
-- Safe to re-run (IF NOT EXISTS / additive). Paste into Supabase SQL Editor if needed.
-- Extends order assignments, equipment bookings, files, order priority.
-- Does NOT replace Business Core / Financial Core / Smart Order Engine.

-- ---------------------------------------------------------------------------
-- Orders — operational priority
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists priority text not null default 'normal';

do $$
begin
  alter table public.orders drop constraint if exists orders_priority_check;
exception
  when undefined_object then null;
end $$;

alter table public.orders
  drop constraint if exists orders_priority_check;

alter table public.orders
  add constraint orders_priority_check
  check (priority in ('low', 'normal', 'high', 'urgent'));

-- ---------------------------------------------------------------------------
-- Order assignments — call time, meeting point, status
-- ---------------------------------------------------------------------------
alter table public.order_assignments
  add column if not exists call_time text;

alter table public.order_assignments
  add column if not exists meeting_point text;

alter table public.order_assignments
  add column if not exists assignment_status text not null default 'assigned';

do $$
begin
  alter table public.order_assignments drop constraint if exists order_assignments_status_check;
exception
  when undefined_object then null;
end $$;

alter table public.order_assignments
  drop constraint if exists order_assignments_status_check;

alter table public.order_assignments
  add constraint order_assignments_status_check
  check (
    assignment_status in (
      'assigned',
      'confirmed',
      'checked_in',
      'completed',
      'no_show',
      'cancelled'
    )
  );

-- ---------------------------------------------------------------------------
-- Equipment assignments — order/project/date booking (double-book prevention)
-- ---------------------------------------------------------------------------
alter table public.equipment_assignments
  add column if not exists order_id text references public.orders (id) on delete set null;

alter table public.equipment_assignments
  add column if not exists project_id text references public.projects (id) on delete set null;

alter table public.equipment_assignments
  add column if not exists starts_on date;

alter table public.equipment_assignments
  add column if not exists ends_on date;

create index if not exists equipment_assignments_order_id_idx
  on public.equipment_assignments (order_id);

create index if not exists equipment_assignments_project_id_idx
  on public.equipment_assignments (project_id);

create index if not exists equipment_assignments_dates_idx
  on public.equipment_assignments (equipment_id, starts_on, ends_on);

-- ---------------------------------------------------------------------------
-- Files — optional client link + storage URL hint
-- ---------------------------------------------------------------------------
alter table public.files
  add column if not exists client_id text references public.clients (id) on delete set null;

alter table public.files
  add column if not exists storage_url text;

create index if not exists files_client_id_idx on public.files (client_id);

-- ---------------------------------------------------------------------------
-- Storage bucket for order/project files (metadata still in public.files)
-- Best-effort: skip if storage schema is unavailable in this connection.
-- ---------------------------------------------------------------------------
do $$
begin
  insert into storage.buckets (id, name, public)
  values ('soda-files', 'soda-files', false)
  on conflict (id) do nothing;
exception
  when undefined_table then null;
  when insufficient_privilege then null;
  when others then null;
end $$;

-- ---------------------------------------------------------------------------
-- Smart Ops business rules (catalog only — runtime lives in lib/core/rules)
-- ---------------------------------------------------------------------------
create table if not exists public.business_rules_catalog (
  code text primary key,
  name text not null,
  group_id text not null default '',
  description text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.business_rules_catalog (code, name, group_id, description)
values
  (
    'ops.crew-schedule-conflict',
    'Crew schedule conflict detection',
    'calendar',
    'Flag when the same crew member is assigned to overlapping shoot dates'
  ),
  (
    'ops.equipment-double-book',
    'Equipment double-booking prevention',
    'equipment',
    'Block assigning equipment to overlapping order date ranges'
  ),
  (
    'ops.order-reschedule-notify',
    'Reschedule notifications',
    'notifications',
    'Emit OrderRescheduled / notify on shoot or delivery date changes'
  ),
  (
    'ops.assignment-fields',
    'Rich crew assignment fields',
    'crew',
    'Call time, meeting point, expected pay, assignment status'
  )
on conflict (code) do update set
  name = excluded.name,
  group_id = excluded.group_id,
  description = excluded.description,
  updated_at = now();
