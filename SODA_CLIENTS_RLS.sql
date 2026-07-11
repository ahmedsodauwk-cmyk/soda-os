-- SODA Clients RLS (pre-auth production phase)
-- Run in Supabase Dashboard -> SQL Editor.
-- Permissive CRUD for anon + authenticated so the app anon key works.
-- Tighten when real auth / workspace scoping lands.
-- Idempotent: safe to re-run.

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_select_anon" ON public.clients;
DROP POLICY IF EXISTS "clients_insert_anon" ON public.clients;
DROP POLICY IF EXISTS "clients_update_anon" ON public.clients;
DROP POLICY IF EXISTS "clients_delete_anon" ON public.clients;
DROP POLICY IF EXISTS "clients_select_authenticated" ON public.clients;
DROP POLICY IF EXISTS "clients_insert_authenticated" ON public.clients;
DROP POLICY IF EXISTS "clients_update_authenticated" ON public.clients;
DROP POLICY IF EXISTS "clients_delete_authenticated" ON public.clients;
DROP POLICY IF EXISTS "clients_all_anon" ON public.clients;
DROP POLICY IF EXISTS "clients_all_authenticated" ON public.clients;

CREATE POLICY "clients_select_anon"
  ON public.clients FOR SELECT TO anon
  USING (true);

CREATE POLICY "clients_insert_anon"
  ON public.clients FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "clients_update_anon"
  ON public.clients FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "clients_delete_anon"
  ON public.clients FOR DELETE TO anon
  USING (true);

CREATE POLICY "clients_select_authenticated"
  ON public.clients FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "clients_insert_authenticated"
  ON public.clients FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "clients_update_authenticated"
  ON public.clients FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "clients_delete_authenticated"
  ON public.clients FOR DELETE TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO anon, authenticated;