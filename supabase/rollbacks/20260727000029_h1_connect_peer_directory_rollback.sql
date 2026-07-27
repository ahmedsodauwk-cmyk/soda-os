-- Rollback H1 — restore profiles_select_connect_peers (pre-H1 state)

DROP POLICY IF EXISTS profiles_select_connect_peers ON public.profiles;
CREATE POLICY profiles_select_connect_peers ON public.profiles
  FOR SELECT TO authenticated
  USING (
    coalesce(is_active, false) = true
    AND public.connect_viewer_is_active()
  );

REVOKE ALL ON FUNCTION public.connect_get_peers_by_ids(uuid[]) FROM public;
DROP FUNCTION IF EXISTS public.connect_get_peers_by_ids(uuid[]);

REVOKE ALL ON FUNCTION public.connect_list_directory_peers(uuid) FROM public;
DROP FUNCTION IF EXISTS public.connect_list_directory_peers(uuid);

REVOKE ALL ON FUNCTION public.connect_shares_active_conversation(uuid, uuid) FROM public;
DROP FUNCTION IF EXISTS public.connect_shares_active_conversation(uuid, uuid);
