-- SODA Connect — harden provisioning RPCs (Mission 07.0)
-- Only self-ensure for authenticated; full ensure is service_role.

revoke execute on function public.connect_ensure_user(uuid) from authenticated;
revoke execute on function public.connect_ensure_user(uuid) from public;
grant execute on function public.connect_ensure_user(uuid) to service_role;

revoke execute on function public.connect_bootstrap_all_active() from authenticated;
revoke execute on function public.connect_bootstrap_all_active() from public;
grant execute on function public.connect_bootstrap_all_active() to service_role;

-- ensure self remains available
grant execute on function public.connect_ensure_self() to authenticated;
