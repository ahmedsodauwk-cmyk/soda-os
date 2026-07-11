-- SODA OS — Module RLS (pre-auth phase)
-- Paste once into Supabase Dashboard → SQL Editor → Run.
-- Covers every domain table except clients (already applied via SODA_CLIENTS_RLS.sql).
-- Permissive anon + authenticated CRUD. Tighten when real auth lands.

do $$
declare
  t text;
  tables text[] := array[
    'workspaces',
    'workspace_subcategories',
    'people',
    'equipment',
    'equipment_assignments',
    'projects',
    'orders',
    'order_assignments',
    'quotations',
    'payments',
    'invoices',
    'deliveries',
    'financial_events',
    'financial_allocations',
    'files'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists %I on public.%I', t || '_select_anon', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_anon', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_anon', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_anon', t);
    execute format('drop policy if exists %I on public.%I', t || '_select_authenticated', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_authenticated', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_authenticated', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_authenticated', t);

    execute format(
      'create policy %I on public.%I for select to anon using (true)',
      t || '_select_anon', t
    );
    execute format(
      'create policy %I on public.%I for insert to anon with check (true)',
      t || '_insert_anon', t
    );
    execute format(
      'create policy %I on public.%I for update to anon using (true) with check (true)',
      t || '_update_anon', t
    );
    execute format(
      'create policy %I on public.%I for delete to anon using (true)',
      t || '_delete_anon', t
    );

    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      t || '_select_authenticated', t
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (true)',
      t || '_insert_authenticated', t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (true) with check (true)',
      t || '_update_authenticated', t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (true)',
      t || '_delete_authenticated', t
    );

    execute format(
      'grant select, insert, update, delete on public.%I to anon, authenticated',
      t
    );
  end loop;
end $$;
