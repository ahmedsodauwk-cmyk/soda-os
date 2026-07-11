-- SODA Master RLS (pre-auth production phase)
-- Run in Supabase Dashboard -> SQL Editor.
-- Covers every domain table except clients (already applied via SODA_CLIENTS_RLS.sql).
-- Permissive CRUD for anon + authenticated so the app anon key works.
-- Tighten when real auth / workspace scoping lands.
-- Idempotent: safe to re-run.
--
-- Modules covered:
--   Crew            → public.people
--   Equipment       → public.equipment, public.equipment_assignments
--   Commercial / Weddings / Projects
--                   → public.projects, public.workspaces, public.workspace_subcategories
--   Orders          → public.orders, public.order_assignments
--   Quotations      → public.quotations
--   Payments        → public.payments
--   Invoices        → public.invoices, public.deliveries
--   Finance support → public.financial_events, public.financial_allocations, public.files
--   Connection test → public._connection_tests
--
-- Calendar: no dedicated calendar table in SODA_MASTER_SCHEMA.sql / migrations
--   (calendar is jsonb on public.projects). Skipped — do not invent a table.
-- Dashboard: no dedicated table. Skipped.

-- =============================================================================
-- Crew → public.people
-- =============================================================================

ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "people_select_anon" ON public.people;
DROP POLICY IF EXISTS "people_insert_anon" ON public.people;
DROP POLICY IF EXISTS "people_update_anon" ON public.people;
DROP POLICY IF EXISTS "people_delete_anon" ON public.people;
DROP POLICY IF EXISTS "people_select_authenticated" ON public.people;
DROP POLICY IF EXISTS "people_insert_authenticated" ON public.people;
DROP POLICY IF EXISTS "people_update_authenticated" ON public.people;
DROP POLICY IF EXISTS "people_delete_authenticated" ON public.people;
DROP POLICY IF EXISTS "people_all_anon" ON public.people;
DROP POLICY IF EXISTS "people_all_authenticated" ON public.people;

CREATE POLICY "people_select_anon"
  ON public.people FOR SELECT TO anon
  USING (true);

CREATE POLICY "people_insert_anon"
  ON public.people FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "people_update_anon"
  ON public.people FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "people_delete_anon"
  ON public.people FOR DELETE TO anon
  USING (true);

CREATE POLICY "people_select_authenticated"
  ON public.people FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "people_insert_authenticated"
  ON public.people FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "people_update_authenticated"
  ON public.people FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "people_delete_authenticated"
  ON public.people FOR DELETE TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.people TO anon, authenticated;

-- =============================================================================
-- Equipment → public.equipment, public.equipment_assignments
-- =============================================================================

ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "equipment_select_anon" ON public.equipment;
DROP POLICY IF EXISTS "equipment_insert_anon" ON public.equipment;
DROP POLICY IF EXISTS "equipment_update_anon" ON public.equipment;
DROP POLICY IF EXISTS "equipment_delete_anon" ON public.equipment;
DROP POLICY IF EXISTS "equipment_select_authenticated" ON public.equipment;
DROP POLICY IF EXISTS "equipment_insert_authenticated" ON public.equipment;
DROP POLICY IF EXISTS "equipment_update_authenticated" ON public.equipment;
DROP POLICY IF EXISTS "equipment_delete_authenticated" ON public.equipment;
DROP POLICY IF EXISTS "equipment_all_anon" ON public.equipment;
DROP POLICY IF EXISTS "equipment_all_authenticated" ON public.equipment;

CREATE POLICY "equipment_select_anon"
  ON public.equipment FOR SELECT TO anon
  USING (true);

CREATE POLICY "equipment_insert_anon"
  ON public.equipment FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "equipment_update_anon"
  ON public.equipment FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "equipment_delete_anon"
  ON public.equipment FOR DELETE TO anon
  USING (true);

CREATE POLICY "equipment_select_authenticated"
  ON public.equipment FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "equipment_insert_authenticated"
  ON public.equipment FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "equipment_update_authenticated"
  ON public.equipment FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "equipment_delete_authenticated"
  ON public.equipment FOR DELETE TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipment TO anon, authenticated;

ALTER TABLE public.equipment_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "equipment_assignments_select_anon" ON public.equipment_assignments;
DROP POLICY IF EXISTS "equipment_assignments_insert_anon" ON public.equipment_assignments;
DROP POLICY IF EXISTS "equipment_assignments_update_anon" ON public.equipment_assignments;
DROP POLICY IF EXISTS "equipment_assignments_delete_anon" ON public.equipment_assignments;
DROP POLICY IF EXISTS "equipment_assignments_select_authenticated" ON public.equipment_assignments;
DROP POLICY IF EXISTS "equipment_assignments_insert_authenticated" ON public.equipment_assignments;
DROP POLICY IF EXISTS "equipment_assignments_update_authenticated" ON public.equipment_assignments;
DROP POLICY IF EXISTS "equipment_assignments_delete_authenticated" ON public.equipment_assignments;
DROP POLICY IF EXISTS "equipment_assignments_all_anon" ON public.equipment_assignments;
DROP POLICY IF EXISTS "equipment_assignments_all_authenticated" ON public.equipment_assignments;

CREATE POLICY "equipment_assignments_select_anon"
  ON public.equipment_assignments FOR SELECT TO anon
  USING (true);

CREATE POLICY "equipment_assignments_insert_anon"
  ON public.equipment_assignments FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "equipment_assignments_update_anon"
  ON public.equipment_assignments FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "equipment_assignments_delete_anon"
  ON public.equipment_assignments FOR DELETE TO anon
  USING (true);

CREATE POLICY "equipment_assignments_select_authenticated"
  ON public.equipment_assignments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "equipment_assignments_insert_authenticated"
  ON public.equipment_assignments FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "equipment_assignments_update_authenticated"
  ON public.equipment_assignments FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "equipment_assignments_delete_authenticated"
  ON public.equipment_assignments FOR DELETE TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipment_assignments TO anon, authenticated;

-- =============================================================================
-- Commercial / Weddings / Projects
-- → public.workspaces, public.workspace_subcategories, public.projects
-- =============================================================================

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspaces_select_anon" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_insert_anon" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_update_anon" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_delete_anon" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_select_authenticated" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_insert_authenticated" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_update_authenticated" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_delete_authenticated" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_all_anon" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_all_authenticated" ON public.workspaces;

CREATE POLICY "workspaces_select_anon"
  ON public.workspaces FOR SELECT TO anon
  USING (true);

CREATE POLICY "workspaces_insert_anon"
  ON public.workspaces FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "workspaces_update_anon"
  ON public.workspaces FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "workspaces_delete_anon"
  ON public.workspaces FOR DELETE TO anon
  USING (true);

CREATE POLICY "workspaces_select_authenticated"
  ON public.workspaces FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "workspaces_insert_authenticated"
  ON public.workspaces FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "workspaces_update_authenticated"
  ON public.workspaces FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "workspaces_delete_authenticated"
  ON public.workspaces FOR DELETE TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO anon, authenticated;

ALTER TABLE public.workspace_subcategories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_subcategories_select_anon" ON public.workspace_subcategories;
DROP POLICY IF EXISTS "workspace_subcategories_insert_anon" ON public.workspace_subcategories;
DROP POLICY IF EXISTS "workspace_subcategories_update_anon" ON public.workspace_subcategories;
DROP POLICY IF EXISTS "workspace_subcategories_delete_anon" ON public.workspace_subcategories;
DROP POLICY IF EXISTS "workspace_subcategories_select_authenticated" ON public.workspace_subcategories;
DROP POLICY IF EXISTS "workspace_subcategories_insert_authenticated" ON public.workspace_subcategories;
DROP POLICY IF EXISTS "workspace_subcategories_update_authenticated" ON public.workspace_subcategories;
DROP POLICY IF EXISTS "workspace_subcategories_delete_authenticated" ON public.workspace_subcategories;
DROP POLICY IF EXISTS "workspace_subcategories_all_anon" ON public.workspace_subcategories;
DROP POLICY IF EXISTS "workspace_subcategories_all_authenticated" ON public.workspace_subcategories;

CREATE POLICY "workspace_subcategories_select_anon"
  ON public.workspace_subcategories FOR SELECT TO anon
  USING (true);

CREATE POLICY "workspace_subcategories_insert_anon"
  ON public.workspace_subcategories FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "workspace_subcategories_update_anon"
  ON public.workspace_subcategories FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "workspace_subcategories_delete_anon"
  ON public.workspace_subcategories FOR DELETE TO anon
  USING (true);

CREATE POLICY "workspace_subcategories_select_authenticated"
  ON public.workspace_subcategories FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "workspace_subcategories_insert_authenticated"
  ON public.workspace_subcategories FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "workspace_subcategories_update_authenticated"
  ON public.workspace_subcategories FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "workspace_subcategories_delete_authenticated"
  ON public.workspace_subcategories FOR DELETE TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_subcategories TO anon, authenticated;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select_anon" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_anon" ON public.projects;
DROP POLICY IF EXISTS "projects_update_anon" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_anon" ON public.projects;
DROP POLICY IF EXISTS "projects_select_authenticated" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_authenticated" ON public.projects;
DROP POLICY IF EXISTS "projects_update_authenticated" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_authenticated" ON public.projects;
DROP POLICY IF EXISTS "projects_all_anon" ON public.projects;
DROP POLICY IF EXISTS "projects_all_authenticated" ON public.projects;

CREATE POLICY "projects_select_anon"
  ON public.projects FOR SELECT TO anon
  USING (true);

CREATE POLICY "projects_insert_anon"
  ON public.projects FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "projects_update_anon"
  ON public.projects FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "projects_delete_anon"
  ON public.projects FOR DELETE TO anon
  USING (true);

CREATE POLICY "projects_select_authenticated"
  ON public.projects FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "projects_insert_authenticated"
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "projects_update_authenticated"
  ON public.projects FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "projects_delete_authenticated"
  ON public.projects FOR DELETE TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO anon, authenticated;

-- =============================================================================
-- Orders → public.orders, public.order_assignments
-- =============================================================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_anon" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_anon" ON public.orders;
DROP POLICY IF EXISTS "orders_update_anon" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_anon" ON public.orders;
DROP POLICY IF EXISTS "orders_select_authenticated" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_authenticated" ON public.orders;
DROP POLICY IF EXISTS "orders_update_authenticated" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_authenticated" ON public.orders;
DROP POLICY IF EXISTS "orders_all_anon" ON public.orders;
DROP POLICY IF EXISTS "orders_all_authenticated" ON public.orders;

CREATE POLICY "orders_select_anon"
  ON public.orders FOR SELECT TO anon
  USING (true);

CREATE POLICY "orders_insert_anon"
  ON public.orders FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "orders_update_anon"
  ON public.orders FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "orders_delete_anon"
  ON public.orders FOR DELETE TO anon
  USING (true);

CREATE POLICY "orders_select_authenticated"
  ON public.orders FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "orders_insert_authenticated"
  ON public.orders FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "orders_update_authenticated"
  ON public.orders FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "orders_delete_authenticated"
  ON public.orders FOR DELETE TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO anon, authenticated;

ALTER TABLE public.order_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_assignments_select_anon" ON public.order_assignments;
DROP POLICY IF EXISTS "order_assignments_insert_anon" ON public.order_assignments;
DROP POLICY IF EXISTS "order_assignments_update_anon" ON public.order_assignments;
DROP POLICY IF EXISTS "order_assignments_delete_anon" ON public.order_assignments;
DROP POLICY IF EXISTS "order_assignments_select_authenticated" ON public.order_assignments;
DROP POLICY IF EXISTS "order_assignments_insert_authenticated" ON public.order_assignments;
DROP POLICY IF EXISTS "order_assignments_update_authenticated" ON public.order_assignments;
DROP POLICY IF EXISTS "order_assignments_delete_authenticated" ON public.order_assignments;
DROP POLICY IF EXISTS "order_assignments_all_anon" ON public.order_assignments;
DROP POLICY IF EXISTS "order_assignments_all_authenticated" ON public.order_assignments;

CREATE POLICY "order_assignments_select_anon"
  ON public.order_assignments FOR SELECT TO anon
  USING (true);

CREATE POLICY "order_assignments_insert_anon"
  ON public.order_assignments FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "order_assignments_update_anon"
  ON public.order_assignments FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "order_assignments_delete_anon"
  ON public.order_assignments FOR DELETE TO anon
  USING (true);

CREATE POLICY "order_assignments_select_authenticated"
  ON public.order_assignments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "order_assignments_insert_authenticated"
  ON public.order_assignments FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "order_assignments_update_authenticated"
  ON public.order_assignments FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "order_assignments_delete_authenticated"
  ON public.order_assignments FOR DELETE TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_assignments TO anon, authenticated;

-- =============================================================================
-- Quotations → public.quotations
-- =============================================================================

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quotations_select_anon" ON public.quotations;
DROP POLICY IF EXISTS "quotations_insert_anon" ON public.quotations;
DROP POLICY IF EXISTS "quotations_update_anon" ON public.quotations;
DROP POLICY IF EXISTS "quotations_delete_anon" ON public.quotations;
DROP POLICY IF EXISTS "quotations_select_authenticated" ON public.quotations;
DROP POLICY IF EXISTS "quotations_insert_authenticated" ON public.quotations;
DROP POLICY IF EXISTS "quotations_update_authenticated" ON public.quotations;
DROP POLICY IF EXISTS "quotations_delete_authenticated" ON public.quotations;
DROP POLICY IF EXISTS "quotations_all_anon" ON public.quotations;
DROP POLICY IF EXISTS "quotations_all_authenticated" ON public.quotations;

CREATE POLICY "quotations_select_anon"
  ON public.quotations FOR SELECT TO anon
  USING (true);

CREATE POLICY "quotations_insert_anon"
  ON public.quotations FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "quotations_update_anon"
  ON public.quotations FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "quotations_delete_anon"
  ON public.quotations FOR DELETE TO anon
  USING (true);

CREATE POLICY "quotations_select_authenticated"
  ON public.quotations FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "quotations_insert_authenticated"
  ON public.quotations FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "quotations_update_authenticated"
  ON public.quotations FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "quotations_delete_authenticated"
  ON public.quotations FOR DELETE TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotations TO anon, authenticated;

-- =============================================================================
-- Payments → public.payments
-- =============================================================================

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select_anon" ON public.payments;
DROP POLICY IF EXISTS "payments_insert_anon" ON public.payments;
DROP POLICY IF EXISTS "payments_update_anon" ON public.payments;
DROP POLICY IF EXISTS "payments_delete_anon" ON public.payments;
DROP POLICY IF EXISTS "payments_select_authenticated" ON public.payments;
DROP POLICY IF EXISTS "payments_insert_authenticated" ON public.payments;
DROP POLICY IF EXISTS "payments_update_authenticated" ON public.payments;
DROP POLICY IF EXISTS "payments_delete_authenticated" ON public.payments;
DROP POLICY IF EXISTS "payments_all_anon" ON public.payments;
DROP POLICY IF EXISTS "payments_all_authenticated" ON public.payments;

CREATE POLICY "payments_select_anon"
  ON public.payments FOR SELECT TO anon
  USING (true);

CREATE POLICY "payments_insert_anon"
  ON public.payments FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "payments_update_anon"
  ON public.payments FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "payments_delete_anon"
  ON public.payments FOR DELETE TO anon
  USING (true);

CREATE POLICY "payments_select_authenticated"
  ON public.payments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "payments_insert_authenticated"
  ON public.payments FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "payments_update_authenticated"
  ON public.payments FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "payments_delete_authenticated"
  ON public.payments FOR DELETE TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO anon, authenticated;

-- =============================================================================
-- Invoices → public.invoices, public.deliveries
-- =============================================================================

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_select_anon" ON public.invoices;
DROP POLICY IF EXISTS "invoices_insert_anon" ON public.invoices;
DROP POLICY IF EXISTS "invoices_update_anon" ON public.invoices;
DROP POLICY IF EXISTS "invoices_delete_anon" ON public.invoices;
DROP POLICY IF EXISTS "invoices_select_authenticated" ON public.invoices;
DROP POLICY IF EXISTS "invoices_insert_authenticated" ON public.invoices;
DROP POLICY IF EXISTS "invoices_update_authenticated" ON public.invoices;
DROP POLICY IF EXISTS "invoices_delete_authenticated" ON public.invoices;
DROP POLICY IF EXISTS "invoices_all_anon" ON public.invoices;
DROP POLICY IF EXISTS "invoices_all_authenticated" ON public.invoices;

CREATE POLICY "invoices_select_anon"
  ON public.invoices FOR SELECT TO anon
  USING (true);

CREATE POLICY "invoices_insert_anon"
  ON public.invoices FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "invoices_update_anon"
  ON public.invoices FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "invoices_delete_anon"
  ON public.invoices FOR DELETE TO anon
  USING (true);

CREATE POLICY "invoices_select_authenticated"
  ON public.invoices FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "invoices_insert_authenticated"
  ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "invoices_update_authenticated"
  ON public.invoices FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "invoices_delete_authenticated"
  ON public.invoices FOR DELETE TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO anon, authenticated;

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deliveries_select_anon" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_insert_anon" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_update_anon" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_delete_anon" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_select_authenticated" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_insert_authenticated" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_update_authenticated" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_delete_authenticated" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_all_anon" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_all_authenticated" ON public.deliveries;

CREATE POLICY "deliveries_select_anon"
  ON public.deliveries FOR SELECT TO anon
  USING (true);

CREATE POLICY "deliveries_insert_anon"
  ON public.deliveries FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "deliveries_update_anon"
  ON public.deliveries FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "deliveries_delete_anon"
  ON public.deliveries FOR DELETE TO anon
  USING (true);

CREATE POLICY "deliveries_select_authenticated"
  ON public.deliveries FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "deliveries_insert_authenticated"
  ON public.deliveries FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "deliveries_update_authenticated"
  ON public.deliveries FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "deliveries_delete_authenticated"
  ON public.deliveries FOR DELETE TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deliveries TO anon, authenticated;

-- =============================================================================
-- Finance / dashboard support
-- → public.financial_events, public.financial_allocations, public.files
-- =============================================================================

ALTER TABLE public.financial_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "financial_events_select_anon" ON public.financial_events;
DROP POLICY IF EXISTS "financial_events_insert_anon" ON public.financial_events;
DROP POLICY IF EXISTS "financial_events_update_anon" ON public.financial_events;
DROP POLICY IF EXISTS "financial_events_delete_anon" ON public.financial_events;
DROP POLICY IF EXISTS "financial_events_select_authenticated" ON public.financial_events;
DROP POLICY IF EXISTS "financial_events_insert_authenticated" ON public.financial_events;
DROP POLICY IF EXISTS "financial_events_update_authenticated" ON public.financial_events;
DROP POLICY IF EXISTS "financial_events_delete_authenticated" ON public.financial_events;
DROP POLICY IF EXISTS "financial_events_all_anon" ON public.financial_events;
DROP POLICY IF EXISTS "financial_events_all_authenticated" ON public.financial_events;

CREATE POLICY "financial_events_select_anon"
  ON public.financial_events FOR SELECT TO anon
  USING (true);

CREATE POLICY "financial_events_insert_anon"
  ON public.financial_events FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "financial_events_update_anon"
  ON public.financial_events FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "financial_events_delete_anon"
  ON public.financial_events FOR DELETE TO anon
  USING (true);

CREATE POLICY "financial_events_select_authenticated"
  ON public.financial_events FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "financial_events_insert_authenticated"
  ON public.financial_events FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "financial_events_update_authenticated"
  ON public.financial_events FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "financial_events_delete_authenticated"
  ON public.financial_events FOR DELETE TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_events TO anon, authenticated;

ALTER TABLE public.financial_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "financial_allocations_select_anon" ON public.financial_allocations;
DROP POLICY IF EXISTS "financial_allocations_insert_anon" ON public.financial_allocations;
DROP POLICY IF EXISTS "financial_allocations_update_anon" ON public.financial_allocations;
DROP POLICY IF EXISTS "financial_allocations_delete_anon" ON public.financial_allocations;
DROP POLICY IF EXISTS "financial_allocations_select_authenticated" ON public.financial_allocations;
DROP POLICY IF EXISTS "financial_allocations_insert_authenticated" ON public.financial_allocations;
DROP POLICY IF EXISTS "financial_allocations_update_authenticated" ON public.financial_allocations;
DROP POLICY IF EXISTS "financial_allocations_delete_authenticated" ON public.financial_allocations;
DROP POLICY IF EXISTS "financial_allocations_all_anon" ON public.financial_allocations;
DROP POLICY IF EXISTS "financial_allocations_all_authenticated" ON public.financial_allocations;

CREATE POLICY "financial_allocations_select_anon"
  ON public.financial_allocations FOR SELECT TO anon
  USING (true);

CREATE POLICY "financial_allocations_insert_anon"
  ON public.financial_allocations FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "financial_allocations_update_anon"
  ON public.financial_allocations FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "financial_allocations_delete_anon"
  ON public.financial_allocations FOR DELETE TO anon
  USING (true);

CREATE POLICY "financial_allocations_select_authenticated"
  ON public.financial_allocations FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "financial_allocations_insert_authenticated"
  ON public.financial_allocations FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "financial_allocations_update_authenticated"
  ON public.financial_allocations FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "financial_allocations_delete_authenticated"
  ON public.financial_allocations FOR DELETE TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_allocations TO anon, authenticated;

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "files_select_anon" ON public.files;
DROP POLICY IF EXISTS "files_insert_anon" ON public.files;
DROP POLICY IF EXISTS "files_update_anon" ON public.files;
DROP POLICY IF EXISTS "files_delete_anon" ON public.files;
DROP POLICY IF EXISTS "files_select_authenticated" ON public.files;
DROP POLICY IF EXISTS "files_insert_authenticated" ON public.files;
DROP POLICY IF EXISTS "files_update_authenticated" ON public.files;
DROP POLICY IF EXISTS "files_delete_authenticated" ON public.files;
DROP POLICY IF EXISTS "files_all_anon" ON public.files;
DROP POLICY IF EXISTS "files_all_authenticated" ON public.files;

CREATE POLICY "files_select_anon"
  ON public.files FOR SELECT TO anon
  USING (true);

CREATE POLICY "files_insert_anon"
  ON public.files FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "files_update_anon"
  ON public.files FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "files_delete_anon"
  ON public.files FOR DELETE TO anon
  USING (true);

CREATE POLICY "files_select_authenticated"
  ON public.files FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "files_insert_authenticated"
  ON public.files FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "files_update_authenticated"
  ON public.files FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "files_delete_authenticated"
  ON public.files FOR DELETE TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.files TO anon, authenticated;

-- =============================================================================
-- Connection tests → public._connection_tests
-- =============================================================================

ALTER TABLE public._connection_tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "_connection_tests_select_anon" ON public._connection_tests;
DROP POLICY IF EXISTS "_connection_tests_insert_anon" ON public._connection_tests;
DROP POLICY IF EXISTS "_connection_tests_update_anon" ON public._connection_tests;
DROP POLICY IF EXISTS "_connection_tests_delete_anon" ON public._connection_tests;
DROP POLICY IF EXISTS "_connection_tests_select_authenticated" ON public._connection_tests;
DROP POLICY IF EXISTS "_connection_tests_insert_authenticated" ON public._connection_tests;
DROP POLICY IF EXISTS "_connection_tests_update_authenticated" ON public._connection_tests;
DROP POLICY IF EXISTS "_connection_tests_delete_authenticated" ON public._connection_tests;
DROP POLICY IF EXISTS "_connection_tests_all_anon" ON public._connection_tests;
DROP POLICY IF EXISTS "_connection_tests_all_authenticated" ON public._connection_tests;

CREATE POLICY "_connection_tests_select_anon"
  ON public._connection_tests FOR SELECT TO anon
  USING (true);

CREATE POLICY "_connection_tests_insert_anon"
  ON public._connection_tests FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "_connection_tests_update_anon"
  ON public._connection_tests FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "_connection_tests_delete_anon"
  ON public._connection_tests FOR DELETE TO anon
  USING (true);

CREATE POLICY "_connection_tests_select_authenticated"
  ON public._connection_tests FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "_connection_tests_insert_authenticated"
  ON public._connection_tests FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "_connection_tests_update_authenticated"
  ON public._connection_tests FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "_connection_tests_delete_authenticated"
  ON public._connection_tests FOR DELETE TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public._connection_tests TO anon, authenticated;
