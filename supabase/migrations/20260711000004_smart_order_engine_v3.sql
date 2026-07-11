-- SODA OS — Smart Order Engine V3
-- Adds Holding/Confirmed/Completed statuses, brief/dress/late penalty, squad members,
-- client whatsapp. Safe to re-run (IF NOT EXISTS / DROP CONSTRAINT IF EXISTS).

-- ---------------------------------------------------------------------------
-- Clients: WhatsApp
-- ---------------------------------------------------------------------------
alter table public.clients
  add column if not exists whatsapp text;

-- ---------------------------------------------------------------------------
-- Orders: V3 fields
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists brief text not null default '';

alter table public.orders
  add column if not exists dress_code text;

alter table public.orders
  add column if not exists late_penalty_enabled boolean not null default false;

alter table public.orders
  add column if not exists late_penalty_amount numeric(14, 2) not null default 0;

alter table public.orders
  add column if not exists late_penalty_reason text not null default '';

alter table public.orders
  add column if not exists squad_member_ids jsonb not null default '[]'::jsonb;

alter table public.orders
  add column if not exists whatsapp text not null default '';

-- Expand status check: Holding / Confirmed / Completed (+ legacy Pending/Delivered)
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders
  add constraint orders_status_check check (
    status in (
      'Holding',
      'Confirmed',
      'Pending',
      'Scheduled',
      'Shooting',
      'Editing',
      'Completed',
      'Delivered',
      'Cancelled'
    )
  );

-- Dress code check (nullable = unset)
alter table public.orders drop constraint if exists orders_dress_code_check;
alter table public.orders
  add constraint orders_dress_code_check check (
    dress_code is null
    or dress_code in (
      'Formal',
      'Black',
      'White',
      'Traditional',
      'Casual',
      'Custom'
    )
  );

comment on column public.orders.brief is 'Creative brief for the shoot';
comment on column public.orders.dress_code is 'Client dress code preference';
comment on column public.orders.late_penalty_enabled is 'Whether late delivery penalty applies';
comment on column public.orders.squad_member_ids is 'JSON array of people ids selected as squad';
comment on column public.clients.whatsapp is 'WhatsApp number (may differ from phone)';
