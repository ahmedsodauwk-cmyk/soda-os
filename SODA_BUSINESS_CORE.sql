-- SODA OS — Business Core (paste once into Supabase Dashboard → SQL Editor)
-- Creates public.business_events + public.audit_log with RLS matching domain modules.
-- Safe to re-run (IF NOT EXISTS / DROP POLICY IF EXISTS).

-- ---------------------------------------------------------------------------
-- Business events (source-of-truth stream for cross-module sync)
-- ---------------------------------------------------------------------------
create table if not exists public.business_events (
  id text primary key,
  type text not null,
  occurred_at timestamptz not null default now(),
  source text not null default '',
  correlation_id text,
  entity_type text not null,
  entity_id text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists business_events_type_idx
  on public.business_events (type);

create index if not exists business_events_entity_idx
  on public.business_events (entity_type, entity_id);

create index if not exists business_events_occurred_at_idx
  on public.business_events (occurred_at desc);

-- ---------------------------------------------------------------------------
-- Audit log (append-only operational trail)
-- ---------------------------------------------------------------------------
create table if not exists public.audit_log (
  id text primary key,
  event_id text not null,
  event_type text not null,
  occurred_at timestamptz not null default now(),
  source text not null default '',
  entity_type text not null,
  entity_id text not null,
  summary text not null default '',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_event_id_idx
  on public.audit_log (event_id);

create index if not exists audit_log_entity_idx
  on public.audit_log (entity_type, entity_id);

create index if not exists audit_log_occurred_at_idx
  on public.audit_log (occurred_at desc);

-- RLS: anon + authenticated (same pattern as domain module tables)
alter table public.business_events enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists business_events_select_anon on public.business_events;
create policy business_events_select_anon
  on public.business_events for select
  to anon
  using (true);

drop policy if exists business_events_insert_anon on public.business_events;
create policy business_events_insert_anon
  on public.business_events for insert
  to anon
  with check (true);

drop policy if exists business_events_select_authenticated on public.business_events;
create policy business_events_select_authenticated
  on public.business_events for select
  to authenticated
  using (true);

drop policy if exists business_events_insert_authenticated on public.business_events;
create policy business_events_insert_authenticated
  on public.business_events for insert
  to authenticated
  with check (true);

drop policy if exists audit_log_select_anon on public.audit_log;
create policy audit_log_select_anon
  on public.audit_log for select
  to anon
  using (true);

drop policy if exists audit_log_insert_anon on public.audit_log;
create policy audit_log_insert_anon
  on public.audit_log for insert
  to anon
  with check (true);

drop policy if exists audit_log_select_authenticated on public.audit_log;
create policy audit_log_select_authenticated
  on public.audit_log for select
  to authenticated
  using (true);

drop policy if exists audit_log_insert_authenticated on public.audit_log;
create policy audit_log_insert_authenticated
  on public.audit_log for insert
  to authenticated
  with check (true);

comment on table public.business_events is 'Business Core event stream — modules publish after own table writes';
comment on table public.audit_log is 'Append-only audit trail derived from business events';
