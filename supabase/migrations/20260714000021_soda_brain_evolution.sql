-- SODA VISUALS — SODA Brain Evolution (Mission 05.1)
-- Additive only. Safe to re-run.
-- Completely isolated from ERP. Founder-only. No seed/demo rows.
--
-- Extends Mission 05.0:
--   • Workspaces → 10 (Personal Decisions, Meeting Notes, Future Plans, Archive)
--   • Smart money / people / priority / structured AI fields
--   • Chat message log (heuristic classification → Brain only)
--   • History action: archived
--
-- Never writes to clients / orders / finance / crew / calendar.

-- ---------------------------------------------------------------------------
-- Expand workspace check (drop + re-add; Postgres has no ALTER CHECK easily)
-- ---------------------------------------------------------------------------
alter table public.brain_entries drop constraint if exists brain_entries_workspace_check;

alter table public.brain_entries
  add constraint brain_entries_workspace_check
  check (
    workspace in (
      'inbox',
      'money_memory',
      'potential_orders',
      'client_notebook',
      'ideas',
      'reminders',
      'personal_decisions',
      'meeting_notes',
      'future_plans',
      'archive'
    )
  );

-- Expand money_kind for Founder Money Dashboard categories
alter table public.brain_entries drop constraint if exists brain_entries_money_kind_check;

alter table public.brain_entries
  add constraint brain_entries_money_kind_check
  check (
    money_kind is null
    or money_kind in (
      'to_collect',
      'lent',
      'debt',
      'crew_advance',
      'client_debt',
      'note'
    )
  );

-- Expand promote_target placeholders (structure only — never auto-creates ERP)
alter table public.brain_entries drop constraint if exists brain_entries_promote_target_check;

alter table public.brain_entries
  add constraint brain_entries_promote_target_check
  check (
    promote_target is null
    or promote_target in (
      'order',
      'client',
      'reminder',
      'calendar',
      'finance_note',
      'none'
    )
  );

-- ---------------------------------------------------------------------------
-- Additive columns — Smart Entry + AI prep
-- ---------------------------------------------------------------------------
alter table public.brain_entries
  add column if not exists structured_data jsonb not null default '{}'::jsonb;

alter table public.brain_entries
  add column if not exists currency text
    check (currency is null or currency in ('EGP', 'USD', 'EUR', 'SAR', 'AED'));

alter table public.brain_entries
  add column if not exists amount numeric;

alter table public.brain_entries
  add column if not exists money_direction text
    check (
      money_direction is null
      or money_direction in ('in', 'out', 'neutral')
    );

alter table public.brain_entries
  add column if not exists priority text
    check (
      priority is null
      or priority in ('low', 'normal', 'high', 'urgent')
    );

alter table public.brain_entries
  add column if not exists person_label text;

alter table public.brain_entries
  add column if not exists company_label text;

alter table public.brain_entries
  add column if not exists phone text;

alter table public.brain_entries
  add column if not exists budget_note text;

alter table public.brain_entries
  add column if not exists reminder_enabled boolean not null default false;

alter table public.brain_entries
  add column if not exists classification text;

alter table public.brain_entries
  add column if not exists classification_confidence numeric
    check (
      classification_confidence is null
      or (classification_confidence >= 0 and classification_confidence <= 1)
    );

alter table public.brain_entries
  add column if not exists future_ai_summary text;

alter table public.brain_entries
  add column if not exists archived_at timestamptz;

comment on column public.brain_entries.structured_data is
  'Mission-shaped payload (JSON). Never an ERP FK.';

comment on column public.brain_entries.person_label is
  'Free-text person suggestion label — NOT a clients FK.';

comment on column public.brain_entries.company_label is
  'Free-text company suggestion label — NOT a clients/projects FK.';

comment on column public.brain_entries.classification is
  'Heuristic/AI workspace classification label — future AI fills this.';

comment on column public.brain_entries.future_ai_summary is
  'Reserved for future AI summary — unused until AI mission.';

comment on column public.brain_entries.archived_at is
  'When moved to Archive workspace / archived status.';

create index if not exists brain_entries_priority_idx
  on public.brain_entries (priority)
  where priority is not null;

create index if not exists brain_entries_archived_at_idx
  on public.brain_entries (archived_at desc)
  where archived_at is not null;

create index if not exists brain_entries_amount_idx
  on public.brain_entries (amount)
  where amount is not null;

-- ---------------------------------------------------------------------------
-- History — allow archived action (append-only forever)
-- ---------------------------------------------------------------------------
alter table public.brain_entry_history drop constraint if exists brain_entry_history_action_check;

alter table public.brain_entry_history
  add constraint brain_entry_history_action_check
  check (action in ('created', 'updated', 'status_changed', 'archived', 'deleted'));

-- ---------------------------------------------------------------------------
-- brain_chat_messages — Founder Chat log (heuristic; stays in Brain)
-- ---------------------------------------------------------------------------
create table if not exists public.brain_chat_messages (
  id text primary key,
  role text not null
    check (role in ('user', 'assistant', 'system')),
  content text not null default '',
  classified_workspace text
    check (
      classified_workspace is null
      or classified_workspace in (
        'inbox',
        'money_memory',
        'potential_orders',
        'client_notebook',
        'ideas',
        'reminders',
        'personal_decisions',
        'meeting_notes',
        'future_plans',
        'archive'
      )
    ),
  entry_id text references public.brain_entries (id) on delete set null,
  heuristic_meta jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.brain_chat_messages is
  'SODA Brain Chat — Founder conversation. Classifier is heuristic until AI. Never creates ERP rows.';

create index if not exists brain_chat_messages_created_idx
  on public.brain_chat_messages (created_at asc);

alter table public.brain_chat_messages enable row level security;

drop policy if exists brain_chat_messages_founder_all on public.brain_chat_messages;
create policy brain_chat_messages_founder_all
  on public.brain_chat_messages
  for all
  to authenticated
  using (public.is_brain_founder())
  with check (public.is_brain_founder());
