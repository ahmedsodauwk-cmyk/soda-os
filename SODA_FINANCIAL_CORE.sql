-- SODA OS — Financial Core
-- Safe to re-run (IF NOT EXISTS / additive). Paste into Supabase SQL Editor if needed.
-- Extends cash_accounts, adds expenses, period closings, opening-balance support.

-- ---------------------------------------------------------------------------
-- Cash accounts — richer ERP fields (keep existing codes; allow more)
-- ---------------------------------------------------------------------------
alter table public.cash_accounts
  drop constraint if exists cash_accounts_code_check;

alter table public.cash_accounts
  add column if not exists account_type text;

alter table public.cash_accounts
  add column if not exists opening_balance numeric(14, 2) not null default 0;

alter table public.cash_accounts
  add column if not exists status text not null default 'active';

do $$
begin
  alter table public.cash_accounts drop constraint if exists cash_accounts_status_check;
exception
  when undefined_object then null;
end $$;

alter table public.cash_accounts
  drop constraint if exists cash_accounts_status_check;

alter table public.cash_accounts
  add constraint cash_accounts_status_check
  check (status in ('active', 'inactive', 'frozen'));

do $$
begin
  alter table public.cash_accounts drop constraint if exists cash_accounts_account_type_check;
exception
  when undefined_object then null;
end $$;

alter table public.cash_accounts
  drop constraint if exists cash_accounts_account_type_check;

alter table public.cash_accounts
  add constraint cash_accounts_account_type_check
  check (
    account_type is null
    or account_type in (
      'main_cash_safe',
      'secondary_cash_safe',
      'bank',
      'instapay',
      'vodafone_cash',
      'wallet',
      'other'
    )
  );

-- Relax movement account_code check to allow secondary / multi-bank codes
alter table public.cash_account_movements
  drop constraint if exists cash_account_movements_account_code_check;

-- Seed / upsert extended defaults
insert into public.cash_accounts (
  id, code, name, kind, currency, is_active, account_type, opening_balance, status
)
values
  ('ca-cash_safe', 'cash_safe', 'Main Cash Safe', 'cash', 'EGP', true, 'main_cash_safe', 0, 'active'),
  ('ca-secondary_cash_safe', 'secondary_cash_safe', 'Secondary Cash Safe', 'cash', 'EGP', true, 'secondary_cash_safe', 0, 'active'),
  ('ca-bank', 'bank', 'Bank', 'bank', 'EGP', true, 'bank', 0, 'active'),
  ('ca-instapay', 'instapay', 'Instapay Wallet', 'wallet', 'EGP', true, 'instapay', 0, 'active'),
  ('ca-vodafone_cash', 'vodafone_cash', 'Vodafone Cash Wallet', 'wallet', 'EGP', true, 'vodafone_cash', 0, 'active')
on conflict (code) do update set
  name = excluded.name,
  kind = excluded.kind,
  is_active = excluded.is_active,
  account_type = coalesce(public.cash_accounts.account_type, excluded.account_type),
  status = coalesce(nullif(public.cash_accounts.status, ''), excluded.status);

update public.cash_accounts
set account_type = case code
  when 'cash_safe' then 'main_cash_safe'
  when 'secondary_cash_safe' then 'secondary_cash_safe'
  when 'bank' then 'bank'
  when 'instapay' then 'instapay'
  when 'vodafone_cash' then 'vodafone_cash'
  else coalesce(account_type, 'other')
end
where account_type is null;

-- ---------------------------------------------------------------------------
-- Expenses (operational module — always posts ledger + cash movement)
-- ---------------------------------------------------------------------------
create table if not exists public.expenses (
  id text primary key,
  category text not null,
  vendor text,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'EGP' check (currency = 'EGP'),
  account_code text not null,
  account_id text references public.cash_accounts (id),
  receipt_url text,
  expense_date date not null default current_date,
  notes text,
  financial_event_id text,
  cash_movement_id text,
  status text not null default 'posted'
    check (status in ('posted', 'voided')),
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_date_idx on public.expenses (expense_date desc);
create index if not exists expenses_category_idx on public.expenses (category);
create index if not exists expenses_account_idx on public.expenses (account_code);

-- ---------------------------------------------------------------------------
-- Account transfers (links the paired OUT + IN movements)
-- ---------------------------------------------------------------------------
create table if not exists public.account_transfers (
  id text primary key,
  from_account_id text not null references public.cash_accounts (id),
  from_account_code text not null,
  to_account_id text not null references public.cash_accounts (id),
  to_account_code text not null,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'EGP',
  notes text,
  financial_event_id text,
  outflow_movement_id text,
  inflow_movement_id text,
  status text not null default 'posted'
    check (status in ('posted', 'voided')),
  created_by text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists account_transfers_occurred_idx
  on public.account_transfers (occurred_at desc);

-- ---------------------------------------------------------------------------
-- Period closings (month / year) — freeze mutations in closed periods
-- ---------------------------------------------------------------------------
create table if not exists public.period_closings (
  id text primary key,
  period_type text not null check (period_type in ('month', 'year')),
  period_key text not null,
  status text not null default 'closed'
    check (status in ('closed', 'reopened')),
  snapshot jsonb not null default '{}'::jsonb,
  closed_at timestamptz not null default now(),
  closed_by text,
  reopened_at timestamptz,
  reopened_by text,
  reopen_reason text,
  created_at timestamptz not null default now(),
  unique (period_type, period_key)
);

create index if not exists period_closings_key_idx
  on public.period_closings (period_type, period_key);

-- ---------------------------------------------------------------------------
-- Financial events — allow transfer / opening_balance via existing types
-- (category lives in metadata; no enum expansion required for safety)
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.expenses enable row level security;
alter table public.account_transfers enable row level security;
alter table public.period_closings enable row level security;

drop policy if exists expenses_all_anon on public.expenses;
create policy expenses_all_anon
  on public.expenses for all to anon using (true) with check (true);

drop policy if exists expenses_all_authenticated on public.expenses;
create policy expenses_all_authenticated
  on public.expenses for all to authenticated using (true) with check (true);

drop policy if exists transfers_all_anon on public.account_transfers;
create policy transfers_all_anon
  on public.account_transfers for all to anon using (true) with check (true);

drop policy if exists transfers_all_authenticated on public.account_transfers;
create policy transfers_all_authenticated
  on public.account_transfers for all to authenticated using (true) with check (true);

drop policy if exists period_closings_all_anon on public.period_closings;
create policy period_closings_all_anon
  on public.period_closings for all to anon using (true) with check (true);

drop policy if exists period_closings_all_authenticated on public.period_closings;
create policy period_closings_all_authenticated
  on public.period_closings for all to authenticated
  using (true) with check (true);

comment on table public.expenses is 'Company expenses — always posts financial event + cash outflow';
comment on table public.account_transfers is 'Paired OUT+IN cash movements between accounts';
comment on table public.period_closings is 'Monthly/yearly close snapshots — freeze period mutations';
