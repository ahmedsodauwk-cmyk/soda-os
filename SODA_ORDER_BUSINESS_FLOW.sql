-- SODA OS — Order Business Flow (RC1.9)
-- Paste into Supabase SQL Editor if needed. Identical to
-- supabase/migrations/20260712000010_order_business_flow.sql

alter table public.orders
  add column if not exists package_name text;

alter table public.orders
  add column if not exists deliverables jsonb not null default '[]'::jsonb;

alter table public.orders
  add column if not exists reel_count integer not null default 0;

alter table public.orders
  add column if not exists planned_expenses jsonb not null default '[]'::jsonb;

do $$
begin
  alter table public.orders drop constraint if exists orders_reel_count_check;
exception
  when undefined_object then null;
end $$;

alter table public.orders
  add constraint orders_reel_count_check
  check (reel_count >= 0);

alter table public.expenses
  add column if not exists order_id text references public.orders (id) on delete set null;

create index if not exists expenses_order_id_idx on public.expenses (order_id)
  where order_id is not null;

insert into public.permissions (id, label) values
  ('orders.status', 'Update operational order status only'),
  ('orders.finance', 'Edit order pricing and financial fields')
on conflict (id) do nothing;

insert into public.role_permissions (role_id, permission_id)
select 'owner', id from public.permissions
where id in ('orders.status', 'orders.finance')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
values ('admin', 'orders.status')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
values ('team_leader', 'orders.status')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
values ('crew_member', 'orders.status')
on conflict do nothing;
