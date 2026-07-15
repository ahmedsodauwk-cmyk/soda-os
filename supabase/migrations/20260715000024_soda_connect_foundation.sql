-- SODA VISUALS — SODA Connect (Mission 07.0)
-- Official internal communication layer. Additive / idempotent.
-- No ERP tables. No demo/seed users or fake messages.
-- Production: paste into Supabase SQL Editor if not auto-applied.

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
insert into public.permissions (id, label, permission_group) values
  ('connect.view', 'View SODA Connect', 'Connect'),
  ('connect.send', 'Send messages in SODA Connect', 'Connect')
on conflict (id) do update set
  label = excluded.label,
  permission_group = excluded.permission_group;

insert into public.role_permissions (role_id, permission_id)
select level, x
from unnest(array['founder', 'account_manager', 'team_leader', 'team']) as level
cross join unnest(array['connect.view', 'connect.send']) as t(x)
where exists (select 1 from public.permissions p where p.id = x)
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, x
from public.roles r
cross join unnest(array['connect.view', 'connect.send']) as t(x)
where r.id in ('owner', 'admin')
  and exists (select 1 from public.permissions p where p.id = x)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.connect_dm_key(a uuid, b uuid)
returns text
language sql
immutable
as $$
  select case
    when a::text < b::text then a::text || ':' || b::text
    else b::text || ':' || a::text
  end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.connect_conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('private', 'team')),
  title text,
  system_key text unique,
  dm_key text unique,
  is_system boolean not null default false,
  pinned_message_id uuid,
  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint connect_conversations_kind_shape check (
    (kind = 'private' and dm_key is not null and system_key is null)
    or (kind = 'team' and system_key is not null)
  )
);

create table if not exists public.connect_conversation_members (
  conversation_id uuid not null references public.connect_conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  last_read_at timestamptz,
  last_delivered_at timestamptz,
  muted boolean not null default false,
  cleared_before timestamptz,
  primary key (conversation_id, user_id)
);

create index if not exists connect_members_user_idx
  on public.connect_conversation_members (user_id)
  where left_at is null;

create table if not exists public.connect_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.connect_conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null default '',
  message_type text not null default 'text'
    check (message_type in ('text', 'voice', 'system', 'attachment')),
  reply_to_id uuid references public.connect_messages(id) on delete set null,
  forwarded_from_id uuid references public.connect_messages(id) on delete set null,
  is_pinned boolean not null default false,
  edited_at timestamptz,
  deleted_at timestamptz,
  deleted_for_everyone boolean not null default false,
  client_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists connect_messages_conversation_created_idx
  on public.connect_messages (conversation_id, created_at desc);

create unique index if not exists connect_messages_client_id_uidx
  on public.connect_messages (conversation_id, sender_id, client_id)
  where client_id is not null;

alter table public.connect_conversations
  drop constraint if exists connect_conversations_pinned_fk;
alter table public.connect_conversations
  add constraint connect_conversations_pinned_fk
  foreign key (pinned_message_id) references public.connect_messages(id)
  on delete set null;

create table if not exists public.connect_message_hides (
  message_id uuid not null references public.connect_messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create table if not exists public.connect_message_receipts (
  message_id uuid not null references public.connect_messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('delivered', 'read')),
  updated_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create index if not exists connect_receipts_user_idx
  on public.connect_message_receipts (user_id, status);

create table if not exists public.connect_message_reactions (
  message_id uuid not null references public.connect_messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null
    check (emoji in ('👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '✅', '👏', '💯')),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

create table if not exists public.connect_message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.connect_messages(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  kind text not null
    check (kind in ('image', 'video', 'audio', 'voice', 'pdf', 'office', 'zip', 'other')),
  width integer,
  height integer,
  duration_ms integer,
  created_at timestamptz not null default now()
);

create index if not exists connect_attachments_message_idx
  on public.connect_message_attachments (message_id);

create table if not exists public.connect_message_stars (
  message_id uuid not null references public.connect_messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create table if not exists public.connect_presence (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null default 'offline'
    check (status in ('online', 'away', 'busy', 'offline')),
  custom_status text,
  activity text
    check (
      activity is null
      or activity in ('typing', 'recording', 'uploading')
    ),
  activity_conversation_id uuid references public.connect_conversations(id) on delete set null,
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.connect_is_member(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.connect_conversation_members m
    where m.conversation_id = p_conversation_id
      and m.user_id = auth.uid()
      and m.left_at is null
  );
$$;

revoke all on function public.connect_is_member(uuid) from public;
grant execute on function public.connect_is_member(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Provisioning (service / security definer)
-- ---------------------------------------------------------------------------
create or replace function public.connect_ensure_team_room()
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_id uuid;
begin
  select id into v_id
  from public.connect_conversations
  where system_key = 'soda-team'
  limit 1;

  if v_id is null then
    insert into public.connect_conversations (kind, title, system_key, is_system)
    values ('team', 'SODA Team', 'soda-team', true)
    returning id into v_id;
  end if;

  return v_id;
end;
$$;

create or replace function public.connect_ensure_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_team uuid;
  r record;
  v_dm uuid;
  v_key text;
begin
  if p_user_id is null then
    return;
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = p_user_id and coalesce(p.is_active, false) = true
  ) then
    return;
  end if;

  insert into public.connect_presence (user_id, status, last_seen_at, updated_at)
  values (p_user_id, 'offline', now(), now())
  on conflict (user_id) do nothing;

  v_team := public.connect_ensure_team_room();

  insert into public.connect_conversation_members (conversation_id, user_id)
  values (v_team, p_user_id)
  on conflict (conversation_id, user_id) do update
    set left_at = null;

  for r in
    select p.id as other_id
    from public.profiles p
    where coalesce(p.is_active, false) = true
      and p.id <> p_user_id
  loop
    v_key := public.connect_dm_key(p_user_id, r.other_id);

    select id into v_dm
    from public.connect_conversations
    where dm_key = v_key
    limit 1;

    if v_dm is null then
      insert into public.connect_conversations (kind, title, dm_key, is_system)
      values ('private', null, v_key, false)
      returning id into v_dm;
    end if;

    insert into public.connect_conversation_members (conversation_id, user_id)
    values (v_dm, p_user_id)
    on conflict (conversation_id, user_id) do update
      set left_at = null;

    insert into public.connect_conversation_members (conversation_id, user_id)
    values (v_dm, r.other_id)
    on conflict (conversation_id, user_id) do update
      set left_at = null;
  end loop;
end;
$$;

create or replace function public.connect_bootstrap_all_active()
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  r record;
begin
  perform public.connect_ensure_team_room();
  for r in
    select id from public.profiles where coalesce(is_active, false) = true
  loop
    perform public.connect_ensure_user(r.id);
  end loop;
end;
$$;

revoke all on function public.connect_ensure_team_room() from public;
revoke all on function public.connect_ensure_user(uuid) from public;
revoke all on function public.connect_bootstrap_all_active() from public;
grant execute on function public.connect_ensure_team_room() to service_role;
grant execute on function public.connect_ensure_user(uuid) to service_role;
grant execute on function public.connect_bootstrap_all_active() to service_role;

-- Authenticated may call ensure for self only
create or replace function public.connect_ensure_self()
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  perform public.connect_ensure_user(auth.uid());
end;
$$;

revoke all on function public.connect_ensure_self() from public;
grant execute on function public.connect_ensure_self() to authenticated;

-- Keep Team room undeletable via trigger
create or replace function public.connect_protect_system_room()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' and old.is_system = true then
    raise exception 'SODA Team room cannot be deleted';
  end if;
  if tg_op = 'UPDATE' and old.is_system = true and new.is_system = false then
    raise exception 'SODA Team room cannot lose system flag';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists connect_protect_system_room_trg on public.connect_conversations;
create trigger connect_protect_system_room_trg
  before update or delete on public.connect_conversations
  for each row execute function public.connect_protect_system_room();

-- Preview + last_message_at on insert
create or replace function public.connect_after_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  preview text;
begin
  preview := case
    when new.deleted_for_everyone then 'تم حذف الرسالة'
    when new.message_type = 'voice' then '🎤 رسالة صوتية'
    when new.message_type = 'attachment' then '📎 مرفق'
    else left(coalesce(new.body, ''), 160)
  end;

  update public.connect_conversations
  set
    last_message_at = new.created_at,
    last_message_preview = preview,
    updated_at = now()
  where id = new.conversation_id;

  insert into public.connect_message_receipts (message_id, user_id, status, updated_at)
  select new.id, m.user_id, 'delivered', now()
  from public.connect_conversation_members m
  where m.conversation_id = new.conversation_id
    and m.left_at is null
    and m.user_id <> new.sender_id
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists connect_after_message_insert_trg on public.connect_messages;
create trigger connect_after_message_insert_trg
  after insert on public.connect_messages
  for each row execute function public.connect_after_message_insert();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.connect_conversations enable row level security;
alter table public.connect_conversation_members enable row level security;
alter table public.connect_messages enable row level security;
alter table public.connect_message_hides enable row level security;
alter table public.connect_message_receipts enable row level security;
alter table public.connect_message_reactions enable row level security;
alter table public.connect_message_attachments enable row level security;
alter table public.connect_message_stars enable row level security;
alter table public.connect_presence enable row level security;

drop policy if exists connect_conversations_select on public.connect_conversations;
create policy connect_conversations_select on public.connect_conversations
  for select to authenticated
  using (public.connect_is_member(id));

-- Members may update preview/pin fields; system rooms stay undeletable via trigger
drop policy if exists connect_conversations_update on public.connect_conversations;
create policy connect_conversations_update on public.connect_conversations
  for update to authenticated
  using (public.connect_is_member(id))
  with check (public.connect_is_member(id));

drop policy if exists connect_members_select on public.connect_conversation_members;
create policy connect_members_select on public.connect_conversation_members
  for select to authenticated
  using (public.connect_is_member(conversation_id) or user_id = auth.uid());

drop policy if exists connect_members_update_self on public.connect_conversation_members;
create policy connect_members_update_self on public.connect_conversation_members
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists connect_messages_select on public.connect_messages;
create policy connect_messages_select on public.connect_messages
  for select to authenticated
  using (
    public.connect_is_member(conversation_id)
    and not exists (
      select 1 from public.connect_message_hides h
      where h.message_id = connect_messages.id and h.user_id = auth.uid()
    )
  );

drop policy if exists connect_messages_insert on public.connect_messages;
create policy connect_messages_insert on public.connect_messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and public.connect_is_member(conversation_id)
  );

drop policy if exists connect_messages_update on public.connect_messages;
create policy connect_messages_update on public.connect_messages
  for update to authenticated
  using (
    public.connect_is_member(conversation_id)
    and (sender_id = auth.uid() or public.connect_is_member(conversation_id))
  )
  with check (public.connect_is_member(conversation_id));

drop policy if exists connect_hides_all on public.connect_message_hides;
create policy connect_hides_all on public.connect_message_hides
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists connect_receipts_select on public.connect_message_receipts;
create policy connect_receipts_select on public.connect_message_receipts
  for select to authenticated
  using (
    exists (
      select 1 from public.connect_messages m
      where m.id = message_id and public.connect_is_member(m.conversation_id)
    )
  );

drop policy if exists connect_receipts_upsert on public.connect_message_receipts;
create policy connect_receipts_upsert on public.connect_message_receipts
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists connect_reactions_select on public.connect_message_reactions;
create policy connect_reactions_select on public.connect_message_reactions
  for select to authenticated
  using (
    exists (
      select 1 from public.connect_messages m
      where m.id = message_id and public.connect_is_member(m.conversation_id)
    )
  );

drop policy if exists connect_reactions_write on public.connect_message_reactions;
create policy connect_reactions_write on public.connect_message_reactions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists connect_attachments_select on public.connect_message_attachments;
create policy connect_attachments_select on public.connect_message_attachments
  for select to authenticated
  using (
    exists (
      select 1 from public.connect_messages m
      where m.id = message_id and public.connect_is_member(m.conversation_id)
    )
  );

drop policy if exists connect_attachments_insert on public.connect_message_attachments;
create policy connect_attachments_insert on public.connect_message_attachments
  for insert to authenticated
  with check (
    exists (
      select 1 from public.connect_messages m
      where m.id = message_id
        and m.sender_id = auth.uid()
        and public.connect_is_member(m.conversation_id)
    )
  );

drop policy if exists connect_stars_all on public.connect_message_stars;
create policy connect_stars_all on public.connect_message_stars
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists connect_presence_select on public.connect_presence;
create policy connect_presence_select on public.connect_presence
  for select to authenticated
  using (true);

drop policy if exists connect_presence_upsert on public.connect_presence;
create policy connect_presence_upsert on public.connect_presence
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Active peers for Connect directory (membership-safe; no Founder leak of messages).
-- NEVER SELECT profiles inside a profiles policy — that causes 42P17 RLS recursion
-- and a full-app /login ↔ / redirect loop. Helper uses row_security = off.
create or replace function public.connect_viewer_is_active()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and coalesce(is_active, false) = true
  );
$$;

revoke all on function public.connect_viewer_is_active() from public;
grant execute on function public.connect_viewer_is_active() to authenticated;

drop policy if exists profiles_select_connect_peers on public.profiles;
create policy profiles_select_connect_peers on public.profiles
  for select to authenticated
  using (
    coalesce(is_active, false) = true
    and public.connect_viewer_is_active()
  );

-- ---------------------------------------------------------------------------
-- Storage bucket `connect`
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('connect', 'connect', false)
on conflict (id) do nothing;

drop policy if exists connect_storage_select on storage.objects;
create policy connect_storage_select on storage.objects
  for select to authenticated
  using (bucket_id = 'connect' and auth.uid() is not null);

drop policy if exists connect_storage_insert on storage.objects;
create policy connect_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'connect'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists connect_storage_update on storage.objects;
create policy connect_storage_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'connect'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists connect_storage_delete on storage.objects;
create policy connect_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'connect'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.connect_messages;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.connect_message_receipts;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.connect_message_reactions;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.connect_presence;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.connect_conversations;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.connect_conversation_members;
  exception when duplicate_object then null;
  end;
end;
$$;

-- Bootstrap existing active accounts (structural only — no fake messages)
select public.connect_bootstrap_all_active();
