-- Mission 06.1 — Notification lifecycle (additive only)
-- Content still hydrates from business_events; this table stores per-user lifecycle.
-- Hybrid: DB durable when available; app falls back to localStorage for optimistic UI.

alter table public.notifications
  add column if not exists status text not null default 'unread',
  add column if not exists category text,
  add column if not exists priority text,
  add column if not exists requires_ack boolean not null default false,
  add column if not exists acknowledged_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists dismissed_at timestamptz,
  add column if not exists history jsonb not null default '[]'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

-- Keep read boolean in sync with status for older clients
comment on column public.notifications.status is
  'Lifecycle: unread | read | acknowledged | completed';
comment on column public.notifications.read is
  'Legacy mirror: true when status != unread';

-- One lifecycle row per user + event
create unique index if not exists notifications_user_event_uidx
  on public.notifications (user_id, event_id)
  where user_id is not null and event_id is not null;

create index if not exists notifications_user_status_idx
  on public.notifications (user_id, status, created_at desc);

-- Insert own (was granted but missing policy)
drop policy if exists "notifications_insert_own" on public.notifications;
create policy "notifications_insert_own"
  on public.notifications for insert
  with check (auth.uid() = user_id);

-- Allow delete/archive cleanup for own rows
drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own"
  on public.notifications for delete
  using (auth.uid() = user_id);

grant delete on public.notifications to authenticated;
