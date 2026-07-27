-- SODA VISUALS — Personal Brain (per-user private workspace)
-- Additive migration — DO NOT apply to Production without Founder approval.
-- Isolated from SODA Brain (brain_entries) and ERP tables.
-- Founder cannot read other users' personal brains via RLS.

-- ---------------------------------------------------------------------------
-- personal_brain_entries — private per-user notes (owner-scoped)
-- ---------------------------------------------------------------------------
create table if not exists public.personal_brain_entries (
  id text primary key,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  workspace text not null default 'inbox'
    check (workspace in ('inbox', 'tasks', 'notes', 'reminders', 'archive')),
  title text,
  body text not null default '',
  status text,
  due_at timestamptz,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.personal_brain_entries is
  'Personal Brain — per-user private notes. Never mixed with SODA Brain (Founder) or ERP.';

create index if not exists personal_brain_entries_owner_idx
  on public.personal_brain_entries (owner_user_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- personal_brain_entry_history — append-only owner-scoped timeline
-- ---------------------------------------------------------------------------
create table if not exists public.personal_brain_entry_history (
  id text primary key,
  entry_id text not null
    references public.personal_brain_entries (id) on delete cascade,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  changed_at timestamptz not null default now(),
  changed_by uuid references auth.users (id) on delete set null,
  action text not null
    check (action in ('created', 'updated', 'status_changed', 'archived', 'deleted')),
  snapshot jsonb not null default '{}'::jsonb,
  note text
);

comment on table public.personal_brain_entry_history is
  'Append-only history for Personal Brain entries — owner-scoped only.';

create index if not exists personal_brain_entry_history_entry_idx
  on public.personal_brain_entry_history (entry_id, changed_at desc);

-- ---------------------------------------------------------------------------
-- personal_brain_chat_messages — private per-user chat log
-- ---------------------------------------------------------------------------
create table if not exists public.personal_brain_chat_messages (
  id text primary key,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null default '',
  entry_id text references public.personal_brain_entries (id) on delete set null,
  heuristic_meta jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.personal_brain_chat_messages is
  'Personal Brain Chat — per-user private conversation. Never visible to Founder or other users.';

create index if not exists personal_brain_chat_messages_owner_idx
  on public.personal_brain_chat_messages (owner_user_id, created_at asc);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.personal_brain_entries_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists personal_brain_entries_set_updated_at on public.personal_brain_entries;
create trigger personal_brain_entries_set_updated_at
  before update on public.personal_brain_entries
  for each row
  execute function public.personal_brain_entries_set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — owner-only; NO founder bypass (isolation from SODA Brain)
-- ---------------------------------------------------------------------------
alter table public.personal_brain_entries enable row level security;
alter table public.personal_brain_entry_history enable row level security;
alter table public.personal_brain_chat_messages enable row level security;

create or replace function public.is_personal_brain_owner(target_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and auth.uid() = target_owner;
$$;

comment on function public.is_personal_brain_owner(uuid) is
  'Personal Brain gate — authenticated user must own the row. Founder has no override.';

drop policy if exists personal_brain_entries_owner_all on public.personal_brain_entries;
create policy personal_brain_entries_owner_all
  on public.personal_brain_entries
  for all
  to authenticated
  using (public.is_personal_brain_owner(owner_user_id))
  with check (public.is_personal_brain_owner(owner_user_id));

drop policy if exists personal_brain_history_owner_select on public.personal_brain_entry_history;
create policy personal_brain_history_owner_select
  on public.personal_brain_entry_history
  for select
  to authenticated
  using (public.is_personal_brain_owner(owner_user_id));

drop policy if exists personal_brain_history_owner_insert on public.personal_brain_entry_history;
create policy personal_brain_history_owner_insert
  on public.personal_brain_entry_history
  for insert
  to authenticated
  with check (public.is_personal_brain_owner(owner_user_id));

drop policy if exists personal_brain_chat_owner_all on public.personal_brain_chat_messages;
create policy personal_brain_chat_owner_all
  on public.personal_brain_chat_messages
  for all
  to authenticated
  using (public.is_personal_brain_owner(owner_user_id))
  with check (public.is_personal_brain_owner(owner_user_id));
