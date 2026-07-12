-- SODA OS — Order Business Flow (RC1.9)
-- Additive only. Safe to re-run (IF NOT EXISTS).
-- Extends orders with package / deliverables / planned expenses;
-- links expenses to orders for post-shoot expense reports.

-- ---------------------------------------------------------------------------
-- Orders — package, deliverables, reel count, planned expenses
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Expenses — link to order (post-shoot expense report)
-- ---------------------------------------------------------------------------
alter table public.expenses
  add column if not exists order_id text references public.orders (id) on delete set null;

create index if not exists expenses_order_id_idx on public.expenses (order_id)
  where order_id is not null;

-- ---------------------------------------------------------------------------
-- Identity — orders.status (crew ops) + orders.finance (pricing)
-- permissions.id IS the permission key (see identity_nav migration)
-- ---------------------------------------------------------------------------
insert into public.permissions (id, label) values
  ('orders.status', 'Update operational order status only'),
  ('orders.finance', 'Edit order pricing and financial fields')
on conflict (id) do nothing;

-- Owner: finance + status. Admin: status only (ops via orders.edit; no pricing).
insert into public.role_permissions (role_id, permission_id)
select 'owner', id from public.permissions
where id in ('orders.status', 'orders.finance')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
values ('admin', 'orders.status')
on conflict do nothing;

-- Team leader: status only (ops edit already via orders.edit; no finance)
insert into public.role_permissions (role_id, permission_id)
values ('team_leader', 'orders.status')
on conflict do nothing;

-- Crew: status-only transitions
insert into public.role_permissions (role_id, permission_id)
values ('crew_member', 'orders.status')
on conflict do nothing;
