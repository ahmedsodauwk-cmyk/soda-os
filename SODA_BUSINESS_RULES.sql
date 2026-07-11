-- SODA OS — Business Rules Engine (wallets, payment methods, crew earnings)
-- Safe to re-run (IF NOT EXISTS / additive columns).
-- Paste into Supabase Dashboard → SQL Editor if credentials unavailable.

-- ---------------------------------------------------------------------------
-- Payment enrichment (method / reference / receiver + voided status)
-- ---------------------------------------------------------------------------
alter table public.payments
  add column if not exists method text;

alter table public.payments
  add column if not exists reference text;

alter table public.payments
  add column if not exists receiver text;

-- Expand payment status to allow voided (financial safety — never delete)
do $$
begin
  alter table public.payments drop constraint if exists payments_status_check;
exception
  when undefined_object then null;
end $$;

alter table public.payments
  drop constraint if exists payments_status_check;

alter table public.payments
  add constraint payments_status_check
  check (status in ('pending', 'paid', 'failed', 'waived', 'voided'));

do $$
begin
  alter table public.payments drop constraint if exists payments_method_check;
exception
  when undefined_object then null;
end $$;

alter table public.payments
  drop constraint if exists payments_method_check;

alter table public.payments
  add constraint payments_method_check
  check (
    method is null
    or method in ('cash', 'bank', 'instapay', 'vodafone_cash')
  );

-- ---------------------------------------------------------------------------
-- Company cash accounts (Cash Safe / Bank / Instapay / Vodafone Cash)
-- ---------------------------------------------------------------------------
create table if not exists public.cash_accounts (
  id text primary key,
  code text not null unique
    check (code in ('cash_safe', 'bank', 'instapay', 'vodafone_cash')),
  name text not null,
  kind text not null check (kind in ('cash', 'bank', 'wallet')),
  currency text not null default 'EGP' check (currency = 'EGP'),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.cash_account_movements (
  id text primary key,
  account_id text not null references public.cash_accounts (id),
  account_code text not null
    check (account_code in ('cash_safe', 'bank', 'instapay', 'vodafone_cash')),
  financial_event_id text,
  payment_id text,
  direction text not null check (direction in ('inflow', 'outflow')),
  amount numeric(14, 2) not null check (amount >= 0),
  occurred_at timestamptz not null default now(),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cash_account_movements_account_idx
  on public.cash_account_movements (account_code, occurred_at desc);

create index if not exists cash_account_movements_payment_idx
  on public.cash_account_movements (payment_id);

-- Seed default accounts (idempotent by code)
insert into public.cash_accounts (id, code, name, kind, currency, is_active)
values
  ('ca-cash_safe', 'cash_safe', 'Cash Safe', 'cash', 'EGP', true),
  ('ca-bank', 'bank', 'Bank', 'bank', 'EGP', true),
  ('ca-instapay', 'instapay', 'Instapay Wallet', 'wallet', 'EGP', true),
  ('ca-vodafone_cash', 'vodafone_cash', 'Vodafone Cash Wallet', 'wallet', 'EGP', true)
on conflict (code) do update set
  name = excluded.name,
  kind = excluded.kind,
  is_active = excluded.is_active;

-- ---------------------------------------------------------------------------
-- Crew wallet / pending earnings
-- ---------------------------------------------------------------------------
create table if not exists public.crew_earnings (
  id text primary key,
  person_id text not null,
  assignment_id text,
  order_id text,
  client_id text,
  project_id text,
  client_name text,
  project_name text,
  shoot_date date,
  role text not null default 'Crew',
  amount numeric(14, 2) not null default 0,
  status text not null
    check (status in ('pending', 'paid', 'voided', 'cancelled')),
  paid_at timestamptz,
  financial_event_id text,
  bonus_kind text check (bonus_kind is null or bonus_kind = 'monthly_target'),
  month_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crew_earnings_person_idx
  on public.crew_earnings (person_id, status);

create index if not exists crew_earnings_order_idx
  on public.crew_earnings (order_id);

create index if not exists crew_earnings_assignment_idx
  on public.crew_earnings (assignment_id);

-- ---------------------------------------------------------------------------
-- RLS (anon + authenticated — matches existing module pattern)
-- ---------------------------------------------------------------------------
alter table public.cash_accounts enable row level security;
alter table public.cash_account_movements enable row level security;
alter table public.crew_earnings enable row level security;

drop policy if exists cash_accounts_all_anon on public.cash_accounts;
create policy cash_accounts_all_anon
  on public.cash_accounts for all to anon using (true) with check (true);

drop policy if exists cash_accounts_all_authenticated on public.cash_accounts;
create policy cash_accounts_all_authenticated
  on public.cash_accounts for all to authenticated using (true) with check (true);

drop policy if exists cash_movements_all_anon on public.cash_account_movements;
create policy cash_movements_all_anon
  on public.cash_account_movements for all to anon using (true) with check (true);

drop policy if exists cash_movements_all_authenticated on public.cash_account_movements;
create policy cash_movements_all_authenticated
  on public.cash_account_movements for all to authenticated
  using (true) with check (true);

drop policy if exists crew_earnings_all_anon on public.crew_earnings;
create policy crew_earnings_all_anon
  on public.crew_earnings for all to anon using (true) with check (true);

drop policy if exists crew_earnings_all_authenticated on public.crew_earnings;
create policy crew_earnings_all_authenticated
  on public.crew_earnings for all to authenticated
  using (true) with check (true);

-- No UPDATE/DELETE policies needed beyond "for all" — app never deletes money rows.
-- Financial events remain append-only; reverse/void/correction post new events.

comment on table public.cash_accounts is 'Company cash/bank/wallet accounts by payment method';
comment on table public.cash_account_movements is 'Append-only cash movements — never delete';
comment on table public.crew_earnings is 'Crew wallet pending/paid earnings + monthly target bonuses';
