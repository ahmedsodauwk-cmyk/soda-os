-- SODA VISUALS — HOTFIX: remaining profiles 42P17 (Connect peers RLS)
-- Safe to re-run (CREATE OR REPLACE / DROP POLICY IF EXISTS).
--
-- Production still has recursive select via profiles_select_connect_peers
-- (nested EXISTS … FROM profiles inside a profiles policy) OR an incomplete
-- helper without row_security=off. Result: every profiles SELECT → 42P17
-- and `[session] profile SELECT failed (recursion) 42P17`.
--
-- Pattern mirrors 20260714000019_profiles_rls_recursion_repair.sql:
-- SECURITY DEFINER + SET row_security = off. Uses plpgsql so the body is
-- never inlined into the policy expression (SQL functions can lose SET).

CREATE OR REPLACE FUNCTION public.connect_viewer_is_active()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND coalesce(is_active, false) = true
  );
END;
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
