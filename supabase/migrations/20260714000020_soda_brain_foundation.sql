-- SODA VISUALS — SODA Brain (Founder Intelligence Workspace) Mission 05.0
-- Safe to re-run (IF NOT EXISTS / ON CONFLICT / additive).
--
-- Completely isolated from ERP (clients/orders/projects/finance/crew).
-- Founder-only. No seed/demo rows.
--
-- Future (structure only — unused now):
--   • AI classification: raw_text, classification_status
--   • Promote Engine: promote_target, promoted_at, promoted_ref
--
-- Production: paste into Supabase SQL Editor if not auto-applied.

-- ---------------------------------------------------------------------------
-- Permission catalog (Founder-only grant below)
-- ---------------------------------------------------------------------------
insert into public.permissions (id, label, permission_group) values
  ('brain.view', 'View SODA Brain', 'SODA Brain'),
  ('brain.edit', 'Edit SODA Brain', 'SODA Brain')
on conflict (id) do update set
  label = excluded.label,
  permission_group = excluded.permission_group;

-- Founder only — never grant to AM / TL / Team by default
insert into public.role_permissions (role_id, permission_id)
select 'founder', x
from unnest(array['brain.view', 'brain.edit']) as t(x)
where exists (select 1 from public.permissions p where p.id = x)
on conflict do nothing;

-- Legacy owner/admin templates (if present) — same Founder intelligence gate
insert into public.role_permissions (role_id, permission_id)
select r.id, x
from public.roles r
cross join unnest(array['brain.view', 'brain.edit']) as t(x)
where r.id in ('owner', 'admin')
  and exists (select 1 from public.permissions p where p.id = x)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- brain_entries — unified Founder second-brain rows (no ERP FKs)
-- ---------------------------------------------------------------------------
create table if not exists public.brain_entries (
  id text primary key,
  workspace text not null
    check (
      workspace in (
        'inbox',
        'money_memory',
        'potential_orders',
        'client_notebook',
        'ideas',
        'reminders'
      )
    ),
  title text,
  body text not null default '',
  -- Free-form status (workspace-specific values enforced in app)
  status text,
  -- Potential Orders confidence 0–100
  confidence integer
    check (confidence is null or (confidence >= 0 and confidence <= 100)),
  -- Client Notebook: free label only — NEVER FK to public.clients
  client_label text,
  -- Money Memory helpers (unofficial — never writes Finance)
  money_kind text
    check (
      money_kind is null
      or money_kind in ('to_collect', 'lent', 'debt', 'note')
    ),
  amount_note text,
  -- Reminders
  due_at timestamptz,
  tags text[] not null default '{}',
  -- Future AI classification layer (unused now)
  raw_text text,
  classification_status text
    check (
      classification_status is null
      or classification_status in ('pending', 'classified', 'skipped')
    ),
  -- Future Promote Engine (unused now — never auto-creates ERP rows)
  promote_target text
    check (
      promote_target is null
      or promote_target in (
        'order',
        'client',
        'finance_note',
        'calendar',
        'none'
      )
    ),
  promoted_at timestamptz,
  promoted_ref text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.brain_entries is
  'SODA Brain — Founder-only second brain. Isolated from ERP. Never auto-creates business entities.';

comment on column public.brain_entries.client_label is
  'Private relationship label — not a FK to clients. Never auto CRM.';

comment on column public.brain_entries.raw_text is
  'Future AI classification input — unused in Mission 05.0.';

comment on column public.brain_entries.classification_status is
  'Future AI classification status — unused in Mission 05.0.';

comment on column public.brain_entries.promote_target is
  'Future Promote Engine target — structure only; promotion not implemented.';

create index if not exists brain_entries_workspace_idx
  on public.brain_entries (workspace);

create index if not exists brain_entries_updated_at_idx
  on public.brain_entries (updated_at desc);

create index if not exists brain_entries_created_at_idx
  on public.brain_entries (created_at desc);

create index if not exists brain_entries_status_idx
  on public.brain_entries (status)
  where status is not null;

-- Optional trigram search indexes when pg_trgm is available (app uses ilike fallback)
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_trgm') then
    execute 'create index if not exists brain_entries_title_trgm_idx on public.brain_entries using gin (title gin_trgm_ops)';
    execute 'create index if not exists brain_entries_body_trgm_idx on public.brain_entries using gin (body gin_trgm_ops)';
  end if;
exception
  when others then
    null;
end $$;

-- ---------------------------------------------------------------------------
-- brain_entry_history — append-only timeline (Founder always sees when written)
-- ---------------------------------------------------------------------------
create table if not exists public.brain_entry_history (
  id text primary key,
  entry_id text not null references public.brain_entries (id) on delete cascade,
  changed_at timestamptz not null default now(),
  changed_by uuid references auth.users (id) on delete set null,
  action text not null
    check (action in ('created', 'updated', 'status_changed', 'deleted')),
  snapshot jsonb not null default '{}'::jsonb,
  note text
);

comment on table public.brain_entry_history is
  'Append-only history for SODA Brain entries. Never mutates ERP tables.';

create index if not exists brain_entry_history_entry_idx
  on public.brain_entry_history (entry_id, changed_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.brain_entries_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists brain_entries_set_updated_at on public.brain_entries;
create trigger brain_entries_set_updated_at
  before update on public.brain_entries
  for each row
  execute function public.brain_entries_set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — Founder / owner / admin only (via profiles.access_level or role)
-- ---------------------------------------------------------------------------
alter table public.brain_entries enable row level security;
alter table public.brain_entry_history enable row level security;

create or replace function public.is_brain_founder()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        p.access_level = 'founder'
        or p.role in ('owner', 'founder', 'admin')
      )
  );
$$;

comment on function public.is_brain_founder() is
  'SODA Brain gate: access_level founder (or legacy owner/founder/admin role).';

drop policy if exists brain_entries_founder_all on public.brain_entries;
create policy brain_entries_founder_all
  on public.brain_entries
  for all
  to authenticated
  using (public.is_brain_founder())
  with check (public.is_brain_founder());

drop policy if exists brain_entry_history_founder_select on public.brain_entry_history;
create policy brain_entry_history_founder_select
  on public.brain_entry_history
  for select
  to authenticated
  using (public.is_brain_founder());

drop policy if exists brain_entry_history_founder_insert on public.brain_entry_history;
create policy brain_entry_history_founder_insert
  on public.brain_entry_history
  for insert
  to authenticated
  with check (public.is_brain_founder());

-- No UPDATE/DELETE on history (append-only). Service role bypasses RLS for repos.
