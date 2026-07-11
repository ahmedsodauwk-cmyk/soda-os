-- Sprint 16 — throwaway table for connection read/write smoke tests.
-- Scripts insert then delete rows; do not store business data here.

create table if not exists public._connection_tests (
  id uuid primary key default gen_random_uuid(),
  note text not null default 'soda-os-smoke',
  created_at timestamptz not null default now()
);

comment on table public._connection_tests is
  'Ephemeral smoke-test rows only; safe to truncate';
