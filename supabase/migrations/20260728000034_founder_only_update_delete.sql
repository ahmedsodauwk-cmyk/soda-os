-- Founder-only UPDATE/DELETE lockdown (Preview — not Production).
-- SELECT and INSERT policies unchanged. Non-Founder UPDATE/DELETE denied.

-- ---------------------------------------------------------------------------
-- Clients
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS sr01_clients_update ON public.clients;
CREATE POLICY sr01_clients_update ON public.clients
  FOR UPDATE TO authenticated
  USING (public.soda_is_domain_founder())
  WITH CHECK (public.soda_is_domain_founder());

DROP POLICY IF EXISTS sr01_clients_delete ON public.clients;
CREATE POLICY sr01_clients_delete ON public.clients
  FOR DELETE TO authenticated
  USING (public.soda_is_domain_founder());

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS sr01_projects_update ON public.projects;
CREATE POLICY sr01_projects_update ON public.projects
  FOR UPDATE TO authenticated
  USING (public.soda_is_domain_founder())
  WITH CHECK (public.soda_is_domain_founder());

-- sr01_projects_delete already founder-only

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS sr01_orders_update ON public.orders;
CREATE POLICY sr01_orders_update ON public.orders
  FOR UPDATE TO authenticated
  USING (public.soda_is_domain_founder())
  WITH CHECK (public.soda_is_domain_founder());

DROP POLICY IF EXISTS sr01_orders_delete ON public.orders;
CREATE POLICY sr01_orders_delete ON public.orders
  FOR DELETE TO authenticated
  USING (public.soda_is_domain_founder());

-- ---------------------------------------------------------------------------
-- Order assignments (reassign)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS sr01_order_assignments_write ON public.order_assignments;
CREATE POLICY sr01_order_assignments_write ON public.order_assignments
  FOR ALL TO authenticated
  USING (public.soda_is_domain_founder())
  WITH CHECK (public.soda_is_domain_founder());

-- ---------------------------------------------------------------------------
-- Quotations
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS sr01_quotations_update ON public.quotations;
CREATE POLICY sr01_quotations_update ON public.quotations
  FOR UPDATE TO authenticated
  USING (public.soda_is_domain_founder())
  WITH CHECK (public.soda_is_domain_founder());

DROP POLICY IF EXISTS sr01_quotations_delete ON public.quotations;
CREATE POLICY sr01_quotations_delete ON public.quotations
  FOR DELETE TO authenticated
  USING (public.soda_is_domain_founder());

-- ---------------------------------------------------------------------------
-- Deliveries
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS sr01_deliveries_write ON public.deliveries;
CREATE POLICY sr01_deliveries_write ON public.deliveries
  FOR ALL TO authenticated
  USING (public.soda_is_domain_founder())
  WITH CHECK (public.soda_is_domain_founder());

-- ---------------------------------------------------------------------------
-- Files
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS sr01_files_write ON public.files;
CREATE POLICY sr01_files_write ON public.files
  FOR ALL TO authenticated
  USING (public.soda_is_domain_founder())
  WITH CHECK (public.soda_is_domain_founder());

COMMENT ON POLICY sr01_orders_update ON public.orders IS
  'Founder-only UPDATE — non-Founder read scope unchanged via sr01_orders_select.';
