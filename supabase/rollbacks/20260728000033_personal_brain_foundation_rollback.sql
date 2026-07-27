-- Rollback: Personal Brain foundation (20260728000033)
-- Emergency restore — drops personal brain tables only.

drop policy if exists personal_brain_chat_owner_all on public.personal_brain_chat_messages;
drop policy if exists personal_brain_history_owner_insert on public.personal_brain_entry_history;
drop policy if exists personal_brain_history_owner_select on public.personal_brain_entry_history;
drop policy if exists personal_brain_entries_owner_all on public.personal_brain_entries;

drop function if exists public.is_personal_brain_owner(uuid);
drop function if exists public.personal_brain_entries_set_updated_at() cascade;

drop table if exists public.personal_brain_chat_messages;
drop table if exists public.personal_brain_entry_history;
drop table if exists public.personal_brain_entries;
