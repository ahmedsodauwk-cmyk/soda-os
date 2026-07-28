-- Rollback: restore SR-01 scoped UPDATE/DELETE (pre-founder lockdown).
-- Apply only when reverting 20260728000034_founder_only_update_delete.sql.

DROP POLICY IF EXISTS sr01_clients_update ON public.clients;
CREATE POLICY sr01_clients_update ON public.clients
  FOR UPDATE TO authenticated
  USING (public.soda_can_access_client(id))
  WITH CHECK (public.soda_can_access_client(id));

DROP POLICY IF EXISTS sr01_clients_delete ON public.clients;
CREATE POLICY sr01_clients_delete ON public.clients
  FOR DELETE TO authenticated
  USING (
    public.soda_is_domain_founder()
    OR (
      public.soda_profile_access_level() = 'account_manager'
      AND public.soda_can_access_client(id)
    )
  );

DROP POLICY IF EXISTS sr01_projects_update ON public.projects;
CREATE POLICY sr01_projects_update ON public.projects
  FOR UPDATE TO authenticated
  USING (public.soda_can_access_project(id))
  WITH CHECK (public.soda_can_access_project(id));

DROP POLICY IF EXISTS sr01_orders_update ON public.orders;
CREATE POLICY sr01_orders_update ON public.orders
  FOR UPDATE TO authenticated
  USING (public.soda_can_access_order(id))
  WITH CHECK (public.soda_can_access_order(id));

DROP POLICY IF EXISTS sr01_orders_delete ON public.orders;
CREATE POLICY sr01_orders_delete ON public.orders
  FOR DELETE TO authenticated
  USING (
    public.soda_is_domain_founder()
    OR (
      public.soda_profile_access_level() IN ('account_manager', 'team_leader')
      AND public.soda_can_access_order(id)
    )
  );

DROP POLICY IF EXISTS sr01_order_assignments_write ON public.order_assignments;
CREATE POLICY sr01_order_assignments_write ON public.order_assignments
  FOR ALL TO authenticated
  USING (
    public.soda_is_domain_founder()
    OR (
      public.soda_profile_access_level() IN ('account_manager', 'team_leader')
      AND public.soda_can_access_order(order_id)
    )
  )
  WITH CHECK (
    public.soda_is_domain_founder()
    OR (
      public.soda_profile_access_level() IN ('account_manager', 'team_leader')
      AND public.soda_can_access_order(order_id)
    )
  );

DROP POLICY IF EXISTS sr01_quotations_update ON public.quotations;
CREATE POLICY sr01_quotations_update ON public.quotations
  FOR UPDATE TO authenticated
  USING (public.soda_can_access_quotation(id))
  WITH CHECK (public.soda_can_access_quotation(id));

DROP POLICY IF EXISTS sr01_quotations_delete ON public.quotations;
CREATE POLICY sr01_quotations_delete ON public.quotations
  FOR DELETE TO authenticated
  USING (
    public.soda_is_domain_founder()
    OR (
      public.soda_profile_access_level() = 'account_manager'
      AND public.soda_can_access_quotation(id)
    )
  );

DROP POLICY IF EXISTS sr01_deliveries_write ON public.deliveries;
CREATE POLICY sr01_deliveries_write ON public.deliveries
  FOR ALL TO authenticated
  USING (
    public.soda_is_domain_founder()
    OR public.soda_can_access_order(order_id)
  )
  WITH CHECK (
    public.soda_is_domain_founder()
    OR public.soda_can_access_order(order_id)
  );

DROP POLICY IF EXISTS sr01_files_write ON public.files;
CREATE POLICY sr01_files_write ON public.files
  FOR ALL TO authenticated
  USING (
    public.soda_is_domain_founder()
    OR (order_id IS NOT NULL AND public.soda_can_access_order(order_id))
    OR public.soda_can_access_project(project_id)
  )
  WITH CHECK (
    public.soda_is_domain_founder()
    OR (order_id IS NOT NULL AND public.soda_can_access_order(order_id))
    OR public.soda_can_access_project(project_id)
  );
