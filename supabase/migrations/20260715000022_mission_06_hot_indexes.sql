-- Mission 06.0 Phase 12 — Additive hot-path indexes ONLY.
-- Safe to apply in Supabase SQL Editor. No data mutations.
-- Most hot indexes already exist from earlier migrations; this file
-- is idempotent (IF NOT EXISTS) for Production catch-up.

-- orders.client_id (init already had orders_client_id_idx — keep IF NOT EXISTS)
create index if not exists orders_client_id_idx
  on public.orders (client_id);

-- brain_entries.workspace (foundation migration — keep IF NOT EXISTS)
create index if not exists brain_entries_workspace_idx
  on public.brain_entries (workspace);

-- notifications by user + recency (identity_nav — keep IF NOT EXISTS)
create index if not exists notifications_user_id_created_idx
  on public.notifications (user_id, created_at desc);

-- business_events recency (business_core — keep IF NOT EXISTS)
create index if not exists business_events_occurred_at_idx
  on public.business_events (occurred_at desc);

-- profiles.id is PRIMARY KEY — no extra index needed.

-- Covering helper for Order hub filters (status + client) — additive only
create index if not exists orders_client_status_idx
  on public.orders (client_id, status);

comment on index public.orders_client_status_idx is
  'Mission 06.0 — additive composite for client/order hub lookups';
