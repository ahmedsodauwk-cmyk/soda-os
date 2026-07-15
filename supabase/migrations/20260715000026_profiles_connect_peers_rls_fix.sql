-- SODA VISUALS — HOTFIX: profiles_select_connect_peers RLS recursion (42P17)
-- Safe to re-run (CREATE OR REPLACE / DROP POLICY IF EXISTS).
--
-- Root cause (full-app /login ↔ / redirect loop):
--   Connect foundation added profiles_select_connect_peers with
--   EXISTS (SELECT 1 FROM public.profiles me ...) inside a profiles policy.
--   That re-enters RLS → PostgreSQL 42P17 on every profiles SELECT.
--   Session resolution then returns null → shell redirect /login →
--   middleware sees auth cookie → redirect / → continuous refresh.
--
-- Same class of bug as 20260714000019_profiles_rls_recursion_repair.sql.
-- Scope: replace ONLY the recursive Connect peers SELECT policy.

CREATE OR REPLACE FUNCTION public.connect_viewer_is_active()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND coalesce(is_active, false) = true
  );
$$;

REVOKE ALL ON FUNCTION public.connect_viewer_is_active() FROM public;
GRANT EXECUTE ON FUNCTION public.connect_viewer_is_active() TO authenticated;

DROP POLICY IF EXISTS profiles_select_connect_peers ON public.profiles;
CREATE POLICY profiles_select_connect_peers ON public.profiles
  FOR SELECT TO authenticated
  USING (
    coalesce(is_active, false) = true
    AND public.connect_viewer_is_active()
  );
