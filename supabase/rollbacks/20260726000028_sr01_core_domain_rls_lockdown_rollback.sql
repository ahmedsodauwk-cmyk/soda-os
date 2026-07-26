-- SR-01 rollback — restores pre-SR-01 permissive C1 policies (emergency only).
-- NOT auto-applied. Run manually in Supabase SQL Editor if rollback required.
-- Safe to re-run (DROP POLICY IF EXISTS).

-- ---------------------------------------------------------------------------
-- Drop SR-01 policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS sr01_workspaces_select ON public.workspaces;
DROP POLICY IF EXISTS sr01_workspaces_write ON public.workspaces;
DROP POLICY IF EXISTS sr01_workspace_subcategories_select ON public.workspace_subcategories;
DROP POLICY IF EXISTS sr01_workspace_subcategories_write ON public.workspace_subcategories;
DROP POLICY IF EXISTS sr01_clients_select ON public.clients;
DROP POLICY IF EXISTS sr01_clients_insert ON public.clients;
DROP POLICY IF EXISTS sr01_clients_update ON public.clients;
DROP POLICY IF EXISTS sr01_clients_delete ON public.clients;
DROP POLICY IF EXISTS sr01_people_select ON public.people;
DROP POLICY IF EXISTS sr01_people_write ON public.people;
DROP POLICY IF EXISTS sr01_equipment_select ON public.equipment;
DROP POLICY IF EXISTS sr01_equipment_write ON public.equipment;
DROP POLICY IF EXISTS sr01_equipment_assignments_select ON public.equipment_assignments;
DROP POLICY IF EXISTS sr01_equipment_assignments_write ON public.equipment_assignments;
DROP POLICY IF EXISTS sr01_projects_select ON public.projects;
DROP POLICY IF EXISTS sr01_projects_insert ON public.projects;
DROP POLICY IF EXISTS sr01_projects_update ON public.projects;
DROP POLICY IF EXISTS sr01_projects_delete ON public.projects;
DROP POLICY IF EXISTS sr01_orders_select ON public.orders;
DROP POLICY IF EXISTS sr01_orders_insert ON public.orders;
DROP POLICY IF EXISTS sr01_orders_update ON public.orders;
DROP POLICY IF EXISTS sr01_orders_delete ON public.orders;
DROP POLICY IF EXISTS sr01_order_assignments_select ON public.order_assignments;
DROP POLICY IF EXISTS sr01_order_assignments_write ON public.order_assignments;
DROP POLICY IF EXISTS sr01_quotations_select ON public.quotations;
DROP POLICY IF EXISTS sr01_quotations_insert ON public.quotations;
DROP POLICY IF EXISTS sr01_quotations_update ON public.quotations;
DROP POLICY IF EXISTS sr01_quotations_delete ON public.quotations;
DROP POLICY IF EXISTS sr01_payments_select ON public.payments;
DROP POLICY IF EXISTS sr01_payments_write ON public.payments;
DROP POLICY IF EXISTS sr01_invoices_select ON public.invoices;
DROP POLICY IF EXISTS sr01_invoices_write ON public.invoices;
DROP POLICY IF EXISTS sr01_deliveries_select ON public.deliveries;
DROP POLICY IF EXISTS sr01_deliveries_write ON public.deliveries;
DROP POLICY IF EXISTS sr01_files_select ON public.files;
DROP POLICY IF EXISTS sr01_files_write ON public.files;
DROP POLICY IF EXISTS sr01_financial_events_select ON public.financial_events;
DROP POLICY IF EXISTS sr01_financial_events_write ON public.financial_events;
DROP POLICY IF EXISTS sr01_financial_allocations_select ON public.financial_allocations;
DROP POLICY IF EXISTS sr01_financial_allocations_write ON public.financial_allocations;
DROP POLICY IF EXISTS sr01_expenses_all ON public.expenses;
DROP POLICY IF EXISTS sr01_account_transfers_all ON public.account_transfers;
DROP POLICY IF EXISTS sr01_period_closings_all ON public.period_closings;
DROP POLICY IF EXISTS sr01_cash_accounts_all ON public.cash_accounts;
DROP POLICY IF EXISTS sr01_cash_movements_all ON public.cash_account_movements;
DROP POLICY IF EXISTS sr01_crew_earnings_select ON public.crew_earnings;
DROP POLICY IF EXISTS sr01_crew_earnings_write ON public.crew_earnings;
DROP POLICY IF EXISTS sr01_business_events_select ON public.business_events;
DROP POLICY IF EXISTS sr01_audit_log_select ON public.audit_log;

-- Drop SR-01 helper functions
DROP FUNCTION IF EXISTS public.soda_can_access_quotation(text);
DROP FUNCTION IF EXISTS public.soda_can_access_project(text);
DROP FUNCTION IF EXISTS public.soda_can_access_person(text);
DROP FUNCTION IF EXISTS public.soda_can_access_client(text);
DROP FUNCTION IF EXISTS public.soda_can_access_order(text);
DROP FUNCTION IF EXISTS public.soda_person_shares_order_with(text, text);
DROP FUNCTION IF EXISTS public.soda_order_assigned_to_person(text, text);
DROP FUNCTION IF EXISTS public.soda_profile_display_name();
DROP FUNCTION IF EXISTS public.soda_profile_person_id();
DROP FUNCTION IF EXISTS public.soda_profile_access_level();
DROP FUNCTION IF EXISTS public.soda_is_active_authenticated();
DROP FUNCTION IF EXISTS public.soda_is_domain_founder();

-- ---------------------------------------------------------------------------
-- Restore permissive anon + authenticated policies (pre-SR-01 state)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
  tables text[] := array[
    'workspaces', 'workspace_subcategories', 'people', 'equipment', 'equipment_assignments',
    'projects', 'orders', 'order_assignments', 'quotations', 'payments', 'invoices',
    'deliveries', 'financial_events', 'financial_allocations', 'files'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO anon USING (true)',
      t || '_select_anon', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO anon WITH CHECK (true)',
      t || '_insert_anon', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO anon USING (true) WITH CHECK (true)',
      t || '_update_anon', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO anon USING (true)',
      t || '_delete_anon', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)',
      t || '_select_authenticated', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (true)',
      t || '_insert_authenticated', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)',
      t || '_update_authenticated', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (true)',
      t || '_delete_authenticated', t
    );
    EXECUTE format(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated',
      t
    );
  END LOOP;
END $$;

-- clients
CREATE POLICY "clients_select_anon" ON public.clients FOR SELECT TO anon USING (true);
CREATE POLICY "clients_insert_anon" ON public.clients FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "clients_update_anon" ON public.clients FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "clients_delete_anon" ON public.clients FOR DELETE TO anon USING (true);
CREATE POLICY "clients_select_authenticated" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "clients_insert_authenticated" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "clients_update_authenticated" ON public.clients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "clients_delete_authenticated" ON public.clients FOR DELETE TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO anon, authenticated;

-- financial_core
CREATE POLICY expenses_all_anon ON public.expenses FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY expenses_all_authenticated ON public.expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY transfers_all_anon ON public.account_transfers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY transfers_all_authenticated ON public.account_transfers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY period_closings_all_anon ON public.period_closings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY period_closings_all_authenticated ON public.period_closings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- business_rules
CREATE POLICY cash_accounts_all_anon ON public.cash_accounts FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY cash_accounts_all_authenticated ON public.cash_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY cash_movements_all_anon ON public.cash_account_movements FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY cash_movements_all_authenticated ON public.cash_account_movements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY crew_earnings_all_anon ON public.crew_earnings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY crew_earnings_all_authenticated ON public.crew_earnings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- business_core
CREATE POLICY business_events_select_anon ON public.business_events FOR SELECT TO anon USING (true);
CREATE POLICY business_events_insert_anon ON public.business_events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY business_events_select_authenticated ON public.business_events FOR SELECT TO authenticated USING (true);
CREATE POLICY business_events_insert_authenticated ON public.business_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY audit_log_select_anon ON public.audit_log FOR SELECT TO anon USING (true);
CREATE POLICY audit_log_insert_anon ON public.audit_log FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY audit_log_select_authenticated ON public.audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY audit_log_insert_authenticated ON public.audit_log FOR INSERT TO authenticated WITH CHECK (true);

GRANT SELECT, INSERT ON public.business_events TO anon, authenticated;
GRANT SELECT, INSERT ON public.audit_log TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_transfers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.period_closings TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_accounts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_account_movements TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crew_earnings TO anon, authenticated;
