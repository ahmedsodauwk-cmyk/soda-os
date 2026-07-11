-- Sprint 15 — Soda OS initial schema (empty tables, no seed data)
-- Aligns with lib/*/types.ts. Apply via Supabase SQL editor or:
--   supabase db push / supabase migration up
--
-- Domain repositories remain in-memory until a later sprint wires reads/writes.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Taxonomy (workspaces / subcategories)
-- ---------------------------------------------------------------------------
create table if not exists public.workspaces (
  id text primary key,
  label text not null,
  slug text not null unique,
  description text,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  has_subcategories boolean not null default false,
  color text,
  default_team_id text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_subcategories (
  id text primary key,
  workspace_id text not null references public.workspaces (id) on delete cascade,
  label text not null,
  slug text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create index if not exists workspace_subcategories_workspace_id_idx
  on public.workspace_subcategories (workspace_id);

-- ---------------------------------------------------------------------------
-- Clients
-- ---------------------------------------------------------------------------
create table if not exists public.clients (
  id text primary key,
  type text not null check (type in ('individual', 'company')),
  segment text not null check (segment in ('wedding', 'commercial')),
  name text not null,
  phone text not null default '',
  email text,
  contact_person text,
  company text,
  logo_url text,
  avatar_url text,
  notes text,
  contacts jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_segment_idx on public.clients (segment);
create index if not exists clients_is_active_idx on public.clients (is_active);

-- ---------------------------------------------------------------------------
-- People / Crew
-- ---------------------------------------------------------------------------
create table if not exists public.people (
  id text primary key,
  name_ar text not null,
  name_en text not null,
  nickname text,
  job_title text not null default '',
  job_description text not null default '',
  employment_type text check (
    employment_type is null
    or employment_type in ('full_time', 'part_time', 'freelance', 'contractor')
  ),
  responsibilities jsonb not null default '[]'::jsonb,
  not_responsible_for jsonb not null default '[]'::jsonb,
  phone text not null default '',
  email text not null default '',
  join_date date,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'on_leave')),
  avatar_url text,
  initials text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists people_status_idx on public.people (status);

-- ---------------------------------------------------------------------------
-- Equipment
-- ---------------------------------------------------------------------------
create table if not exists public.equipment (
  id text primary key,
  name text not null,
  type text not null check (
    type in (
      'Camera',
      'Lens',
      'Drone',
      'Laptop',
      'Monitor',
      'SSD',
      'Lighting',
      'Accessories'
    )
  ),
  serial_number text,
  status text not null default 'available'
    check (status in ('available', 'assigned', 'maintenance', 'retired')),
  notes text,
  acquired_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.equipment_assignments (
  id text primary key,
  equipment_id text not null references public.equipment (id) on delete cascade,
  person_id text not null references public.people (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  returned_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists equipment_assignments_equipment_id_idx
  on public.equipment_assignments (equipment_id);
create index if not exists equipment_assignments_person_id_idx
  on public.equipment_assignments (person_id);

-- ---------------------------------------------------------------------------
-- Projects (wedding + commercial via client segment; optional project_type)
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id text primary key,
  name text not null,
  workspace_id text not null references public.workspaces (id),
  subcategory_id text references public.workspace_subcategories (id),
  client_id text not null references public.clients (id),
  client_name text not null default '',
  status text not null default 'Active'
    check (status in ('Active', 'OnHold', 'Completed', 'Cancelled')),
  journey_stage text,
  description text,
  overview jsonb not null default '{"summary":"","milestones":[],"nextAction":""}'::jsonb,
  -- Hub blobs kept as jsonb until normalized in a later sprint
  team jsonb not null default '[]'::jsonb,
  calendar jsonb not null default '[]'::jsonb,
  timeline jsonb not null default '[]'::jsonb,
  notes jsonb not null default '[]'::jsonb,
  activity jsonb not null default '[]'::jsonb,
  deliverables jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_client_id_idx on public.projects (client_id);
create index if not exists projects_workspace_id_idx on public.projects (workspace_id);
create index if not exists projects_status_idx on public.projects (status);
create index if not exists projects_is_active_idx on public.projects (is_active);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id text primary key,
  project_id text not null references public.projects (id) on delete cascade,
  client_id text references public.clients (id),
  client_name text not null default '',
  phone text not null default '',
  project_type text not null check (
    project_type in (
      'Wedding',
      'Engagement',
      'Commercial',
      'Portrait',
      'Event',
      'Product'
    )
  ),
  workspace_id text not null references public.workspaces (id),
  subcategory_id text references public.workspace_subcategories (id),
  shoot_date date,
  location text not null default '',
  delivery_date date,
  price numeric(14, 2) not null default 0,
  deposit numeric(14, 2) not null default 0,
  team text not null default '',
  status text not null default 'Pending'
    check (
      status in (
        'Pending',
        'Scheduled',
        'Shooting',
        'Editing',
        'Delivered',
        'Cancelled'
      )
    ),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_project_id_idx on public.orders (project_id);
create index if not exists orders_client_id_idx on public.orders (client_id);
create index if not exists orders_workspace_id_idx on public.orders (workspace_id);
create index if not exists orders_status_idx on public.orders (status);

-- ---------------------------------------------------------------------------
-- Order → Person assignments (crew pay source of truth)
-- ---------------------------------------------------------------------------
create table if not exists public.order_assignments (
  id text primary key,
  order_id text not null references public.orders (id) on delete cascade,
  person_id text not null references public.people (id) on delete cascade,
  role text not null default '',
  employee_price numeric(14, 2) not null default 0,
  bonus numeric(14, 2) not null default 0,
  deduction numeric(14, 2) not null default 0,
  paid_amount numeric(14, 2) not null default 0,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists order_assignments_order_id_idx
  on public.order_assignments (order_id);
create index if not exists order_assignments_person_id_idx
  on public.order_assignments (person_id);

-- ---------------------------------------------------------------------------
-- Quotations
-- ---------------------------------------------------------------------------
create table if not exists public.quotations (
  id text primary key,
  number text not null unique,
  client_id text references public.clients (id),
  client_name text not null default '',
  company text,
  contact_name text not null default '',
  contact_phone text,
  contact_email text,
  segment text not null check (segment in ('wedding', 'commercial')),
  category text not null default '',
  estimated_value numeric(14, 2) not null default 0,
  probability numeric(5, 2) not null default 0,
  expected_closing_date date,
  assigned_sales text not null default '',
  pipeline_stage text not null default 'New Inquiry',
  approval_status text not null default 'Draft',
  status_timestamps jsonb not null default '{}'::jsonb,
  last_activity timestamptz not null default now(),
  notes text not null default '',
  attachments jsonb not null default '[]'::jsonb,
  versions jsonb not null default '[]'::jsonb,
  current_version integer not null default 1,
  project_info jsonb not null default '{}'::jsonb,
  services jsonb not null default '[]'::jsonb,
  items jsonb not null default '[]'::jsonb,
  optional_items jsonb not null default '[]'::jsonb,
  discount jsonb not null default '{"type":"percent","value":0}'::jsonb,
  tax_rate numeric(8, 4) not null default 0,
  timeline jsonb not null default '{}'::jsonb,
  deliverables jsonb not null default '[]'::jsonb,
  payment_plan jsonb not null default '[]'::jsonb,
  terms text not null default '',
  builder_notes text not null default '',
  converted_project_id text references public.projects (id),
  converted_order_id text references public.orders (id),
  converted_invoice_id text,
  converted_payment_id text,
  converted_client_id text references public.clients (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quotations_client_id_idx on public.quotations (client_id);
create index if not exists quotations_segment_idx on public.quotations (segment);
create index if not exists quotations_pipeline_stage_idx on public.quotations (pipeline_stage);

-- ---------------------------------------------------------------------------
-- Payments (money actuals against orders)
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id text primary key,
  order_id text not null references public.orders (id) on delete cascade,
  project_id text not null references public.projects (id) on delete cascade,
  client_id text not null references public.clients (id),
  workspace_id text not null references public.workspaces (id),
  amount numeric(14, 2) not null,
  currency text not null default 'EGP' check (currency = 'EGP'),
  kind text not null check (kind in ('deposit', 'installment', 'final', 'refund')),
  status text not null check (status in ('pending', 'paid', 'failed', 'waived')),
  paid_at timestamptz,
  note text,
  label text,
  created_at timestamptz not null default now()
);

create index if not exists payments_order_id_idx on public.payments (order_id);
create index if not exists payments_project_id_idx on public.payments (project_id);
create index if not exists payments_client_id_idx on public.payments (client_id);

-- ---------------------------------------------------------------------------
-- Invoices + deliveries
-- ---------------------------------------------------------------------------
create table if not exists public.invoices (
  id text primary key,
  client_id text not null references public.clients (id),
  project_id text references public.projects (id),
  order_id text references public.orders (id),
  number text not null unique,
  issue_date date not null,
  due_date date not null,
  amount numeric(14, 2) not null default 0,
  paid_amount numeric(14, 2) not null default 0,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'partial', 'paid', 'overdue', 'void')),
  period_month text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_client_id_idx on public.invoices (client_id);
create index if not exists invoices_order_id_idx on public.invoices (order_id);
create index if not exists invoices_period_month_idx on public.invoices (period_month);

-- FK from quotations.converted_invoice_id (deferred until invoices exists)
alter table public.quotations
  drop constraint if exists quotations_converted_invoice_id_fkey;
alter table public.quotations
  add constraint quotations_converted_invoice_id_fkey
  foreign key (converted_invoice_id) references public.invoices (id);

alter table public.quotations
  drop constraint if exists quotations_converted_payment_id_fkey;
alter table public.quotations
  add constraint quotations_converted_payment_id_fkey
  foreign key (converted_payment_id) references public.payments (id);

create table if not exists public.deliveries (
  id text primary key,
  order_id text not null references public.orders (id) on delete cascade,
  project_id text not null references public.projects (id) on delete cascade,
  client_id text not null references public.clients (id),
  label text not null,
  due_date date not null,
  delivered_at timestamptz,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'delivered', 'accepted')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists deliveries_order_id_idx on public.deliveries (order_id);
create index if not exists deliveries_client_id_idx on public.deliveries (client_id);

-- ---------------------------------------------------------------------------
-- Financial engine (immutable events + allocations)
-- ---------------------------------------------------------------------------
create table if not exists public.financial_events (
  id text primary key,
  type text not null check (
    type in (
      'client_payment',
      'crew_payment',
      'expense',
      'refund',
      'adjustment'
    )
  ),
  amount numeric(14, 2) not null,
  currency text not null default 'EGP' check (currency = 'EGP'),
  direction text not null check (direction in ('inflow', 'outflow')),
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  created_by text,
  notes text,
  parent_type text not null check (
    parent_type in (
      'order',
      'project',
      'client',
      'crew',
      'quotation',
      'invoice',
      'company',
      'allocation_target'
    )
  ),
  parent_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  payment_id text references public.payments (id),
  invoice_id text references public.invoices (id)
);

create index if not exists financial_events_parent_idx
  on public.financial_events (parent_type, parent_id);
create index if not exists financial_events_occurred_at_idx
  on public.financial_events (occurred_at);
create index if not exists financial_events_type_idx
  on public.financial_events (type);

create table if not exists public.financial_allocations (
  id text primary key,
  financial_event_id text not null
    references public.financial_events (id) on delete cascade,
  amount numeric(14, 2) not null,
  target_type text not null check (
    target_type in (
      'project',
      'order',
      'crew_assignment',
      'invoice_line',
      'expense_category',
      'company'
    )
  ),
  target_id text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists financial_allocations_event_id_idx
  on public.financial_allocations (financial_event_id);
create index if not exists financial_allocations_target_idx
  on public.financial_allocations (target_type, target_id);

-- ---------------------------------------------------------------------------
-- Files / assets (metadata only — storage later)
-- ---------------------------------------------------------------------------
create table if not exists public.files (
  id text primary key,
  name text not null,
  type text not null default '',
  size text not null default '',
  order_id text references public.orders (id) on delete set null,
  project_id text not null references public.projects (id) on delete cascade,
  workspace_id text references public.workspaces (id),
  storage_key text,
  mime_type text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists files_project_id_idx on public.files (project_id);
create index if not exists files_order_id_idx on public.files (order_id);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

drop trigger if exists people_set_updated_at on public.people;
create trigger people_set_updated_at
  before update on public.people
  for each row execute function public.set_updated_at();

drop trigger if exists equipment_set_updated_at on public.equipment;
create trigger equipment_set_updated_at
  before update on public.equipment
  for each row execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists quotations_set_updated_at on public.quotations;
create trigger quotations_set_updated_at
  before update on public.quotations
  for each row execute function public.set_updated_at();

drop trigger if exists invoices_set_updated_at on public.invoices;
create trigger invoices_set_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Notes for operators
-- ---------------------------------------------------------------------------
comment on table public.clients is 'Soda OS clients (wedding + commercial segments)';
comment on table public.people is 'Crew / people — product name The Crew';
comment on table public.projects is 'Commercial + wedding projects; segment via clients.segment';
comment on table public.financial_events is 'Append-only ledger; do not update/delete rows in app logic';
