-- SODA VISUALS — HOTFIX 04.4.5: profiles RLS infinite recursion (42P17)
-- Safe to re-run (CREATE OR REPLACE / DROP POLICY IF EXISTS).
--
-- Proven Production root cause (Founder):
--   SELECT policy "profiles_select_own_or_admin" contains recursive
--   EXISTS (SELECT 1 FROM profiles p ...) → PostgreSQL 42P17.
--   Production policy also hardcodes roles owner/admin (Founder missing),
--   while is_owner_or_admin() includes owner|founder|admin — policy drift.
--
-- Companion risk: if is_owner_or_admin() SELECTs profiles without
-- SET row_security = off, the policy call still re-enters RLS → 42P17.
--
-- Scope: harden helper + replace SELECT policy ONLY.
-- Does NOT touch INSERT/UPDATE policies, Access Level, or permission catalogs.
-- Apply: Supabase Dashboard → SQL Editor → paste → Run.

-- ---------------------------------------------------------------------------
-- 1) Harden helper so policy call does not re-enter RLS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_owner_or_admin()
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
      AND role IN ('owner', 'founder', 'admin')
      AND is_active = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_owner_or_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_owner_or_admin() TO authenticated;

-- ---------------------------------------------------------------------------
-- 2) Replace ONLY the broken SELECT policy (no INSERT / UPDATE)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_owner_or_admin());
