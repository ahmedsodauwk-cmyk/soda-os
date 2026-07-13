-- SODA VISUALS — Auth & Brand Identity Foundation
-- Safe to re-run (IF NOT EXISTS / additive).
--
-- DOES NOT create Auth users or crew accounts.
-- Founder provides official crew list before any account provisioning.
--
-- Adds:
--   • profiles.username + must_change_password
--   • app_settings (company_email_domain, etc.)
--   • resolve_login_email() for username | email sign-in
--   • missing permission catalog rows (orders.status, orders.finance)
--   • Founder-assignable role_permissions remains SoT for custom perms

-- ---------------------------------------------------------------------------
-- App settings (DB-backed company config; env is fallback only)
-- ---------------------------------------------------------------------------
create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_select_authenticated" on public.app_settings;
create policy "app_settings_select_authenticated"
  on public.app_settings for select
  to authenticated
  using (true);

drop policy if exists "app_settings_write_owner" on public.app_settings;
create policy "app_settings_write_owner"
  on public.app_settings for all
  to authenticated
  using (public.is_owner_or_admin())
  with check (public.is_owner_or_admin());

grant select on public.app_settings to authenticated, anon;
grant select, insert, update, delete on public.app_settings to authenticated;

insert into public.app_settings (key, value, description) values
  (
    'company_email_domain',
    'sodavisuals.com',
    'Company email domain for username@domain construction. Changeable from Settings.'
  ),
  (
    'company_display_name',
    'SODA VISUALS',
    'Official company brand name (user-facing).'
  )
on conflict (key) do update set
  description = excluded.description,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Profiles: username + forced password change
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists username text;

alter table public.profiles
  add column if not exists must_change_password boolean not null default false;

-- Unique username when present (case-insensitive via lower index)
create unique index if not exists profiles_username_lower_uidx
  on public.profiles (lower(username))
  where username is not null and length(trim(username)) > 0;

-- Backfill username from email local-part where missing
update public.profiles
set username = lower(split_part(email, '@', 1))
where username is null
  and email is not null
  and position('@' in email) > 1;

-- ---------------------------------------------------------------------------
-- Permission catalog gaps (align with lib/identity/permissions.ts)
-- ---------------------------------------------------------------------------
insert into public.permissions (id, label) values
  ('orders.status', 'Update order operational status'),
  ('orders.finance', 'Edit order pricing / finance fields')
on conflict (id) do update set label = excluded.label;

-- Owner gets every permission (incl. new ones)
insert into public.role_permissions (role_id, permission_id)
select 'owner', id from public.permissions
on conflict do nothing;

-- Admin: all except settings.users (and keep orders.finance off admin — Owner only)
insert into public.role_permissions (role_id, permission_id)
select 'admin', id from public.permissions
where id not in ('settings.users', 'orders.finance')
on conflict do nothing;

-- Team leader + crew: orders.status
insert into public.role_permissions (role_id, permission_id)
values
  ('team_leader', 'orders.status'),
  ('crew_member', 'orders.status')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Login resolver: username OR email → auth email
-- ---------------------------------------------------------------------------
create or replace function public.resolve_login_email(identifier text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  normalized text;
  domain text;
  found_email text;
begin
  if identifier is null or length(trim(identifier)) = 0 then
    return null;
  end if;

  normalized := lower(trim(identifier));

  -- Already an email address
  if position('@' in normalized) > 0 then
    return normalized;
  end if;

  -- Username → profile email
  select p.email into found_email
  from public.profiles p
  where p.is_active = true
    and p.username is not null
    and lower(p.username) = normalized
  limit 1;

  if found_email is not null and length(trim(found_email)) > 0 then
    return lower(trim(found_email));
  end if;

  -- Fallback: username@company_email_domain (for accounts not yet username-indexed)
  select s.value into domain
  from public.app_settings s
  where s.key = 'company_email_domain'
  limit 1;

  domain := lower(coalesce(nullif(trim(domain), ''), 'sodavisuals.com'));
  return normalized || '@' || domain;
end;
$$;

revoke all on function public.resolve_login_email(text) from public;
grant execute on function public.resolve_login_email(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Clear must_change_password helper (callable after successful password update)
-- ---------------------------------------------------------------------------
create or replace function public.clear_must_change_password()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  update public.profiles
  set must_change_password = false,
      updated_at = now()
  where id = auth.uid();
end;
$$;

revoke all on function public.clear_must_change_password() from public;
grant execute on function public.clear_must_change_password() to authenticated;

-- ---------------------------------------------------------------------------
-- handle_new_user: set username from email; do not invent business data
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_role text;
  existing_count int;
  meta_role text;
  chosen_username text;
  force_pw boolean;
begin
  select count(*) into existing_count from public.profiles;
  meta_role := coalesce(new.raw_user_meta_data->>'role', '');
  if existing_count = 0 then
    chosen_role := 'owner';
  elsif meta_role in ('owner','admin','team_leader','crew_member','accountant','client') then
    chosen_role := meta_role;
  else
    chosen_role := 'crew_member';
  end if;

  chosen_username := lower(coalesce(
    nullif(trim(new.raw_user_meta_data->>'username'), ''),
    split_part(coalesce(new.email, ''), '@', 1)
  ));

  force_pw := coalesce((new.raw_user_meta_data->>'must_change_password')::boolean, false);

  insert into public.profiles (
    id, email, full_name, role, is_active, username, must_change_password
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    chosen_role,
    true,
    nullif(chosen_username, ''),
    force_pw
  )
  on conflict (id) do update set
    email = excluded.email,
    username = coalesce(public.profiles.username, excluded.username),
    updated_at = now();

  return new;
end;
$$;
