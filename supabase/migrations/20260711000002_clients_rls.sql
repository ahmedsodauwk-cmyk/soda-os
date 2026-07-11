-- Sprint 17 — Clients RLS (pre-auth phase)
-- Permissive policies so anon + authenticated can CRUD public.clients.
-- Tighten these when real auth / workspace scoping lands.

alter table public.clients enable row level security;

drop policy if exists "clients_select_anon" on public.clients;
drop policy if exists "clients_insert_anon" on public.clients;
drop policy if exists "clients_update_anon" on public.clients;
drop policy if exists "clients_delete_anon" on public.clients;
drop policy if exists "clients_select_authenticated" on public.clients;
drop policy if exists "clients_insert_authenticated" on public.clients;
drop policy if exists "clients_update_authenticated" on public.clients;
drop policy if exists "clients_delete_authenticated" on public.clients;
drop policy if exists "clients_all_anon" on public.clients;
drop policy if exists "clients_all_authenticated" on public.clients;

create policy "clients_select_anon"
  on public.clients for select to anon
  using (true);

create policy "clients_insert_anon"
  on public.clients for insert to anon
  with check (true);

create policy "clients_update_anon"
  on public.clients for update to anon
  using (true)
  with check (true);

create policy "clients_delete_anon"
  on public.clients for delete to anon
  using (true);

create policy "clients_select_authenticated"
  on public.clients for select to authenticated
  using (true);

create policy "clients_insert_authenticated"
  on public.clients for insert to authenticated
  with check (true);

create policy "clients_update_authenticated"
  on public.clients for update to authenticated
  using (true)
  with check (true);

create policy "clients_delete_authenticated"
  on public.clients for delete to authenticated
  using (true);

grant select, insert, update, delete on public.clients to anon, authenticated;
