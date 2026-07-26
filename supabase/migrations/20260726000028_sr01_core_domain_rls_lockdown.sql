-- SR-01 — Core Domain RLS Lockdown (C1)
-- Safe to re-run (DROP POLICY IF EXISTS / CREATE OR REPLACE).
-- Replaces permissive anon/authenticated policies on core business tables.
-- Access Level architecture only — no job_title authorization.

-- ---------------------------------------------------------------------------
-- Preconditions
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'access_level'
  ) THEN
    RAISE EXCEPTION 'SR-01 precondition failed: profiles.access_level missing';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- SECURITY DEFINER helpers (fixed search_path, row_security off — no 42P17)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.soda_is_domain_founder()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_active = true
      AND (
        p.access_level = 'founder'
        OR p.role IN ('owner', 'founder', 'admin')
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.soda_is_active_authenticated()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.soda_profile_access_level()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT p.access_level
  FROM public.profiles p
  WHERE p.id = auth.uid()
    AND p.is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.soda_profile_person_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT p.person_id
  FROM public.profiles p
  WHERE p.id = auth.uid()
    AND p.is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.soda_profile_display_name()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT coalesce(nullif(trim(p.full_name), ''), '')
  FROM public.profiles p
  WHERE p.id = auth.uid()
    AND p.is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.soda_order_assigned_to_person(
  p_order_id text,
  p_person_id text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.order_assignments oa
    WHERE oa.order_id = p_order_id
      AND oa.person_id = p_person_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = p_order_id
      AND o.squad_member_ids @> jsonb_build_array(p_person_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.soda_person_shares_order_with(
  p_person_id text,
  p_other_person_id text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT p_person_id = p_other_person_id
  OR EXISTS (
    SELECT 1
    FROM public.order_assignments a1
    JOIN public.order_assignments a2 ON a1.order_id = a2.order_id
    WHERE a1.person_id = p_person_id
      AND a2.person_id = p_other_person_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.squad_member_ids @> jsonb_build_array(p_person_id, p_other_person_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.soda_can_access_order(p_order_id text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_level text;
  v_person text;
  v_name text;
  v_client_id text;
  v_project_type text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  IF public.soda_is_domain_founder() THEN
    RETURN true;
  END IF;

  v_level := public.soda_profile_access_level();
  v_person := public.soda_profile_person_id();
  v_name := public.soda_profile_display_name();

  IF v_level IS NULL THEN
    RETURN false;
  END IF;

  SELECT o.client_id, o.project_type
  INTO v_client_id, v_project_type
  FROM public.orders o
  WHERE o.id = p_order_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_level = 'account_manager' THEN
    IF v_project_type = 'Commercial' THEN
      RETURN true;
    END IF;
    IF v_client_id IS NOT NULL AND EXISTS (
      SELECT 1
      FROM public.clients c
      WHERE c.id = v_client_id
        AND c.segment = 'commercial'
    ) THEN
      RETURN true;
    END IF;
    IF v_name <> '' AND v_client_id IS NOT NULL AND EXISTS (
      SELECT 1
      FROM public.quotations q
      WHERE q.client_id = v_client_id
        AND lower(trim(q.assigned_sales)) = lower(trim(v_name))
    ) THEN
      RETURN true;
    END IF;
    RETURN false;
  ELSIF v_level = 'team_leader' THEN
    IF v_person IS NULL OR v_person = '' THEN
      RETURN false;
    END IF;
    RETURN public.soda_order_assigned_to_person(p_order_id, v_person)
      OR EXISTS (
        SELECT 1
        FROM public.order_assignments mine
        JOIN public.order_assignments peer ON mine.order_id = peer.order_id
        WHERE mine.person_id = v_person
          AND peer.order_id = p_order_id
      );
  ELSIF v_level = 'team' THEN
    IF v_person IS NULL OR v_person = '' THEN
      RETURN false;
    END IF;
    RETURN public.soda_order_assigned_to_person(p_order_id, v_person);
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.soda_can_access_client(p_client_id text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_level text;
  v_name text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  IF public.soda_is_domain_founder() THEN
    RETURN true;
  END IF;

  v_level := public.soda_profile_access_level();
  v_name := public.soda_profile_display_name();

  IF v_level IS NULL THEN
    RETURN false;
  END IF;

  IF v_level = 'account_manager' THEN
    IF EXISTS (
      SELECT 1
      FROM public.clients c
      WHERE c.id = p_client_id
        AND c.segment = 'commercial'
    ) THEN
      RETURN true;
    END IF;
    IF v_name <> '' AND EXISTS (
      SELECT 1
      FROM public.quotations q
      WHERE q.client_id = p_client_id
        AND lower(trim(q.assigned_sales)) = lower(trim(v_name))
    ) THEN
      RETURN true;
    END IF;
    IF EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.client_id = p_client_id
        AND public.soda_can_access_order(o.id)
    ) THEN
      RETURN true;
    END IF;
    RETURN false;
  ELSIF v_level IN ('team_leader', 'team') THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.client_id = p_client_id
        AND public.soda_can_access_order(o.id)
    );
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.soda_can_access_person(p_person_id text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_level text;
  v_self text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  IF public.soda_is_domain_founder() THEN
    RETURN true;
  END IF;

  v_level := public.soda_profile_access_level();
  v_self := public.soda_profile_person_id();

  IF v_level IS NULL THEN
    RETURN false;
  END IF;

  IF v_level = 'team' THEN
    RETURN v_self IS NOT NULL AND v_self <> '' AND p_person_id = v_self;
  ELSIF v_level = 'team_leader' THEN
    IF v_self IS NULL OR v_self = '' THEN
      RETURN false;
    END IF;
    RETURN public.soda_person_shares_order_with(v_self, p_person_id);
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.soda_can_access_project(p_project_id text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_client_id text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  IF public.soda_is_domain_founder() THEN
    RETURN true;
  END IF;

  SELECT p.client_id INTO v_client_id
  FROM public.projects p
  WHERE p.id = p_project_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF public.soda_can_access_client(v_client_id) THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.project_id = p_project_id
      AND public.soda_can_access_order(o.id)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.soda_can_access_quotation(p_quotation_id text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_level text;
  v_name text;
  v_client_id text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  IF public.soda_is_domain_founder() THEN
    RETURN true;
  END IF;

  v_level := public.soda_profile_access_level();
  v_name := public.soda_profile_display_name();

  SELECT q.client_id INTO v_client_id
  FROM public.quotations q
  WHERE q.id = p_quotation_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_level = 'account_manager' THEN
    IF v_name <> '' AND EXISTS (
      SELECT 1
      FROM public.quotations q
      WHERE q.id = p_quotation_id
        AND lower(trim(q.assigned_sales)) = lower(trim(v_name))
    ) THEN
      RETURN true;
    END IF;
    IF v_client_id IS NOT NULL AND public.soda_can_access_client(v_client_id) THEN
      RETURN true;
    END IF;
    RETURN false;
  END IF;

  IF v_client_id IS NOT NULL AND public.soda_can_access_client(v_client_id) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.soda_is_domain_founder() FROM public;
REVOKE ALL ON FUNCTION public.soda_is_active_authenticated() FROM public;
REVOKE ALL ON FUNCTION public.soda_profile_access_level() FROM public;
REVOKE ALL ON FUNCTION public.soda_profile_person_id() FROM public;
REVOKE ALL ON FUNCTION public.soda_profile_display_name() FROM public;
REVOKE ALL ON FUNCTION public.soda_order_assigned_to_person(text, text) FROM public;
REVOKE ALL ON FUNCTION public.soda_person_shares_order_with(text, text) FROM public;
REVOKE ALL ON FUNCTION public.soda_can_access_order(text) FROM public;
REVOKE ALL ON FUNCTION public.soda_can_access_client(text) FROM public;
REVOKE ALL ON FUNCTION public.soda_can_access_person(text) FROM public;
REVOKE ALL ON FUNCTION public.soda_can_access_project(text) FROM public;
REVOKE ALL ON FUNCTION public.soda_can_access_quotation(text) FROM public;

GRANT EXECUTE ON FUNCTION public.soda_is_domain_founder() TO authenticated;
GRANT EXECUTE ON FUNCTION public.soda_is_active_authenticated() TO authenticated;
GRANT EXECUTE ON FUNCTION public.soda_profile_access_level() TO authenticated;
GRANT EXECUTE ON FUNCTION public.soda_profile_person_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.soda_profile_display_name() TO authenticated;
GRANT EXECUTE ON FUNCTION public.soda_order_assigned_to_person(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.soda_person_shares_order_with(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.soda_can_access_order(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.soda_can_access_client(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.soda_can_access_person(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.soda_can_access_project(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.soda_can_access_quotation(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Drop permissive C1 policies + revoke anon grants
-- ---------------------------------------------------------------------------
DO $$
DECLARE
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
    'files',
    'clients',
    'expenses',
    'account_transfers',
    'period_closings',
    'cash_accounts',
    'cash_account_movements',
    'crew_earnings',
    'business_events',
    'audit_log'
  ];
  suffix text;
  suffixes text[] := array[
    '_select_anon', '_insert_anon', '_update_anon', '_delete_anon',
    '_select_authenticated', '_insert_authenticated',
    '_update_authenticated', '_delete_authenticated',
    '_all_anon', '_all_authenticated'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    FOREACH suffix IN ARRAY suffixes LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || suffix, t);
    END LOOP;

  -- clients uses quoted policy names
    IF t = 'clients' THEN
      EXECUTE 'DROP POLICY IF EXISTS "clients_select_anon" ON public.clients';
      EXECUTE 'DROP POLICY IF EXISTS "clients_insert_anon" ON public.clients';
      EXECUTE 'DROP POLICY IF EXISTS "clients_update_anon" ON public.clients';
      EXECUTE 'DROP POLICY IF EXISTS "clients_delete_anon" ON public.clients';
      EXECUTE 'DROP POLICY IF EXISTS "clients_select_authenticated" ON public.clients';
      EXECUTE 'DROP POLICY IF EXISTS "clients_insert_authenticated" ON public.clients';
      EXECUTE 'DROP POLICY IF EXISTS "clients_update_authenticated" ON public.clients';
      EXECUTE 'DROP POLICY IF EXISTS "clients_delete_authenticated" ON public.clients';
      EXECUTE 'DROP POLICY IF EXISTS "clients_all_anon" ON public.clients';
      EXECUTE 'DROP POLICY IF EXISTS "clients_all_authenticated" ON public.clients';
    END IF;

  -- financial / business_rules use custom names
    IF t = 'expenses' THEN
      EXECUTE 'DROP POLICY IF EXISTS expenses_all_anon ON public.expenses';
      EXECUTE 'DROP POLICY IF EXISTS expenses_all_authenticated ON public.expenses';
    ELSIF t = 'account_transfers' THEN
      EXECUTE 'DROP POLICY IF EXISTS transfers_all_anon ON public.account_transfers';
      EXECUTE 'DROP POLICY IF EXISTS transfers_all_authenticated ON public.account_transfers';
    ELSIF t = 'period_closings' THEN
      EXECUTE 'DROP POLICY IF EXISTS period_closings_all_anon ON public.period_closings';
      EXECUTE 'DROP POLICY IF EXISTS period_closings_all_authenticated ON public.period_closings';
    ELSIF t = 'cash_accounts' THEN
      EXECUTE 'DROP POLICY IF EXISTS cash_accounts_all_anon ON public.cash_accounts';
      EXECUTE 'DROP POLICY IF EXISTS cash_accounts_all_authenticated ON public.cash_accounts';
    ELSIF t = 'cash_account_movements' THEN
      EXECUTE 'DROP POLICY IF EXISTS cash_movements_all_anon ON public.cash_account_movements';
      EXECUTE 'DROP POLICY IF EXISTS cash_movements_all_authenticated ON public.cash_account_movements';
    ELSIF t = 'crew_earnings' THEN
      EXECUTE 'DROP POLICY IF EXISTS crew_earnings_all_anon ON public.crew_earnings';
      EXECUTE 'DROP POLICY IF EXISTS crew_earnings_all_authenticated ON public.crew_earnings';
    ELSIF t = 'business_events' THEN
      EXECUTE 'DROP POLICY IF EXISTS business_events_select_anon ON public.business_events';
      EXECUTE 'DROP POLICY IF EXISTS business_events_insert_anon ON public.business_events';
      EXECUTE 'DROP POLICY IF EXISTS business_events_select_authenticated ON public.business_events';
      EXECUTE 'DROP POLICY IF EXISTS business_events_insert_authenticated ON public.business_events';
    ELSIF t = 'audit_log' THEN
      EXECUTE 'DROP POLICY IF EXISTS audit_log_select_anon ON public.audit_log';
      EXECUTE 'DROP POLICY IF EXISTS audit_log_insert_anon ON public.audit_log';
      EXECUTE 'DROP POLICY IF EXISTS audit_log_select_authenticated ON public.audit_log';
      EXECUTE 'DROP POLICY IF EXISTS audit_log_insert_authenticated ON public.audit_log';
    END IF;

    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', t);
    EXECUTE format(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated',
      t
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Taxonomy — active authenticated users may read; Founder manages
-- ---------------------------------------------------------------------------
CREATE POLICY sr01_workspaces_select ON public.workspaces
  FOR SELECT TO authenticated
  USING (public.soda_is_active_authenticated());

CREATE POLICY sr01_workspaces_write ON public.workspaces
  FOR ALL TO authenticated
  USING (public.soda_is_domain_founder())
  WITH CHECK (public.soda_is_domain_founder());

CREATE POLICY sr01_workspace_subcategories_select ON public.workspace_subcategories
  FOR SELECT TO authenticated
  USING (public.soda_is_active_authenticated());

CREATE POLICY sr01_workspace_subcategories_write ON public.workspace_subcategories
  FOR ALL TO authenticated
  USING (public.soda_is_domain_founder())
  WITH CHECK (public.soda_is_domain_founder());

-- ---------------------------------------------------------------------------
-- Clients
-- ---------------------------------------------------------------------------
CREATE POLICY sr01_clients_select ON public.clients
  FOR SELECT TO authenticated
  USING (public.soda_can_access_client(id));

CREATE POLICY sr01_clients_insert ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK (
    public.soda_is_domain_founder()
    OR public.soda_profile_access_level() = 'account_manager'
  );

CREATE POLICY sr01_clients_update ON public.clients
  FOR UPDATE TO authenticated
  USING (public.soda_can_access_client(id))
  WITH CHECK (public.soda_can_access_client(id));

CREATE POLICY sr01_clients_delete ON public.clients
  FOR DELETE TO authenticated
  USING (
    public.soda_is_domain_founder()
    OR (
      public.soda_profile_access_level() = 'account_manager'
      AND public.soda_can_access_client(id)
    )
  );

-- ---------------------------------------------------------------------------
-- People / equipment
-- ---------------------------------------------------------------------------
CREATE POLICY sr01_people_select ON public.people
  FOR SELECT TO authenticated
  USING (public.soda_can_access_person(id));

CREATE POLICY sr01_people_write ON public.people
  FOR ALL TO authenticated
  USING (public.soda_is_domain_founder())
  WITH CHECK (public.soda_is_domain_founder());

CREATE POLICY sr01_equipment_select ON public.equipment
  FOR SELECT TO authenticated
  USING (
    public.soda_is_domain_founder()
    OR public.soda_profile_access_level() = 'team_leader'
  );

CREATE POLICY sr01_equipment_write ON public.equipment
  FOR ALL TO authenticated
  USING (public.soda_is_domain_founder())
  WITH CHECK (public.soda_is_domain_founder());

CREATE POLICY sr01_equipment_assignments_select ON public.equipment_assignments
  FOR SELECT TO authenticated
  USING (
    public.soda_is_domain_founder()
    OR public.soda_can_access_person(person_id)
  );

CREATE POLICY sr01_equipment_assignments_write ON public.equipment_assignments
  FOR ALL TO authenticated
  USING (public.soda_is_domain_founder())
  WITH CHECK (public.soda_is_domain_founder());

-- ---------------------------------------------------------------------------
-- Projects / orders / assignments
-- ---------------------------------------------------------------------------
CREATE POLICY sr01_projects_select ON public.projects
  FOR SELECT TO authenticated
  USING (public.soda_can_access_project(id));

CREATE POLICY sr01_projects_insert ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (
    public.soda_is_domain_founder()
    OR public.soda_profile_access_level() IN ('account_manager', 'team_leader')
  );

CREATE POLICY sr01_projects_update ON public.projects
  FOR UPDATE TO authenticated
  USING (public.soda_can_access_project(id))
  WITH CHECK (public.soda_can_access_project(id));

CREATE POLICY sr01_projects_delete ON public.projects
  FOR DELETE TO authenticated
  USING (public.soda_is_domain_founder());

CREATE POLICY sr01_orders_select ON public.orders
  FOR SELECT TO authenticated
  USING (public.soda_can_access_order(id));

CREATE POLICY sr01_orders_insert ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (
    public.soda_is_domain_founder()
    OR public.soda_profile_access_level() IN ('account_manager', 'team_leader', 'team')
  );

CREATE POLICY sr01_orders_update ON public.orders
  FOR UPDATE TO authenticated
  USING (public.soda_can_access_order(id))
  WITH CHECK (public.soda_can_access_order(id));

CREATE POLICY sr01_orders_delete ON public.orders
  FOR DELETE TO authenticated
  USING (
    public.soda_is_domain_founder()
    OR (
      public.soda_profile_access_level() IN ('account_manager', 'team_leader')
      AND public.soda_can_access_order(id)
    )
  );

CREATE POLICY sr01_order_assignments_select ON public.order_assignments
  FOR SELECT TO authenticated
  USING (public.soda_can_access_order(order_id));

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

-- ---------------------------------------------------------------------------
-- Quotations / payments / invoices / deliveries
-- ---------------------------------------------------------------------------
CREATE POLICY sr01_quotations_select ON public.quotations
  FOR SELECT TO authenticated
  USING (public.soda_can_access_quotation(id));

CREATE POLICY sr01_quotations_insert ON public.quotations
  FOR INSERT TO authenticated
  WITH CHECK (
    public.soda_is_domain_founder()
    OR public.soda_profile_access_level() = 'account_manager'
  );

CREATE POLICY sr01_quotations_update ON public.quotations
  FOR UPDATE TO authenticated
  USING (public.soda_can_access_quotation(id))
  WITH CHECK (public.soda_can_access_quotation(id));

CREATE POLICY sr01_quotations_delete ON public.quotations
  FOR DELETE TO authenticated
  USING (
    public.soda_is_domain_founder()
    OR (
      public.soda_profile_access_level() = 'account_manager'
      AND public.soda_can_access_quotation(id)
    )
  );

CREATE POLICY sr01_payments_select ON public.payments
  FOR SELECT TO authenticated
  USING (public.soda_can_access_order(order_id));

CREATE POLICY sr01_payments_write ON public.payments
  FOR ALL TO authenticated
  USING (public.soda_is_domain_founder())
  WITH CHECK (public.soda_is_domain_founder());

CREATE POLICY sr01_invoices_select ON public.invoices
  FOR SELECT TO authenticated
  USING (public.soda_can_access_order(order_id));

CREATE POLICY sr01_invoices_write ON public.invoices
  FOR ALL TO authenticated
  USING (public.soda_is_domain_founder())
  WITH CHECK (public.soda_is_domain_founder());

CREATE POLICY sr01_deliveries_select ON public.deliveries
  FOR SELECT TO authenticated
  USING (public.soda_can_access_order(order_id));

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

-- ---------------------------------------------------------------------------
-- Files
-- ---------------------------------------------------------------------------
CREATE POLICY sr01_files_select ON public.files
  FOR SELECT TO authenticated
  USING (
    public.soda_is_domain_founder()
    OR (order_id IS NOT NULL AND public.soda_can_access_order(order_id))
    OR public.soda_can_access_project(project_id)
  );

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

-- ---------------------------------------------------------------------------
-- Finance — Founder only (company finance surfaces)
-- ---------------------------------------------------------------------------
CREATE POLICY sr01_financial_events_select ON public.financial_events
  FOR SELECT TO authenticated
  USING (public.soda_is_domain_founder());

CREATE POLICY sr01_financial_events_write ON public.financial_events
  FOR ALL TO authenticated
  USING (public.soda_is_domain_founder())
  WITH CHECK (public.soda_is_domain_founder());

CREATE POLICY sr01_financial_allocations_select ON public.financial_allocations
  FOR SELECT TO authenticated
  USING (public.soda_is_domain_founder());

CREATE POLICY sr01_financial_allocations_write ON public.financial_allocations
  FOR ALL TO authenticated
  USING (public.soda_is_domain_founder())
  WITH CHECK (public.soda_is_domain_founder());

CREATE POLICY sr01_expenses_all ON public.expenses
  FOR ALL TO authenticated
  USING (public.soda_is_domain_founder())
  WITH CHECK (public.soda_is_domain_founder());

CREATE POLICY sr01_account_transfers_all ON public.account_transfers
  FOR ALL TO authenticated
  USING (public.soda_is_domain_founder())
  WITH CHECK (public.soda_is_domain_founder());

CREATE POLICY sr01_period_closings_all ON public.period_closings
  FOR ALL TO authenticated
  USING (public.soda_is_domain_founder())
  WITH CHECK (public.soda_is_domain_founder());

CREATE POLICY sr01_cash_accounts_all ON public.cash_accounts
  FOR ALL TO authenticated
  USING (public.soda_is_domain_founder())
  WITH CHECK (public.soda_is_domain_founder());

CREATE POLICY sr01_cash_movements_all ON public.cash_account_movements
  FOR ALL TO authenticated
  USING (public.soda_is_domain_founder())
  WITH CHECK (public.soda_is_domain_founder());

CREATE POLICY sr01_crew_earnings_select ON public.crew_earnings
  FOR SELECT TO authenticated
  USING (
    public.soda_is_domain_founder()
    OR (
      public.soda_profile_person_id() IS NOT NULL
      AND person_id = public.soda_profile_person_id()
    )
  );

CREATE POLICY sr01_crew_earnings_write ON public.crew_earnings
  FOR ALL TO authenticated
  USING (public.soda_is_domain_founder())
  WITH CHECK (public.soda_is_domain_founder());

-- ---------------------------------------------------------------------------
-- Business events / audit log — Founder read; writes via service role
-- ---------------------------------------------------------------------------
CREATE POLICY sr01_business_events_select ON public.business_events
  FOR SELECT TO authenticated
  USING (public.soda_is_domain_founder());

CREATE POLICY sr01_audit_log_select ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.soda_is_domain_founder());

COMMENT ON FUNCTION public.soda_can_access_order(text) IS
  'SR-01 domain scope: Access Level–aware order visibility (no job_title auth).';
