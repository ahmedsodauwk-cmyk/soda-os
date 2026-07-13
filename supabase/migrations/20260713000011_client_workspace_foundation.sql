-- SODA OS — Client Workspace foundation (Mission 04.1)
-- Additive: business_role on clients (Client | Partner | Client+Partner).
-- Safe to re-run.

alter table public.clients
  add column if not exists business_role text not null default 'client';

-- Drop/recreate check so re-runs stay idempotent when constraint name exists.
alter table public.clients drop constraint if exists clients_business_role_check;
alter table public.clients
  add constraint clients_business_role_check check (
    business_role in ('client', 'partner', 'both')
  );

comment on column public.clients.business_role is
  'Business relationship role: client | partner | both — not a separate entity';

comment on table public.clients is
  'Central business entity (Client Workspace SoT). Projects and Orders belong under a Client.';
