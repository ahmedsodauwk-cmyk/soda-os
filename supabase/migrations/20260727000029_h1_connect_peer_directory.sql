-- H1 — Narrow Connect peer PII exposure (audit 2026-07-16)
-- Replaces company-wide profiles_select_connect_peers enumeration with RPC directory
-- and conversation-scoped peer lookup. Email/access_level hidden except for Founder.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.connect_shares_active_conversation(p_viewer uuid, p_peer uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.connect_conversation_members m1
    JOIN public.connect_conversation_members m2
      ON m1.conversation_id = m2.conversation_id
    WHERE m1.user_id = p_viewer
      AND m2.user_id = p_peer
      AND m1.left_at IS NULL
      AND m2.left_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION public.connect_shares_active_conversation(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.connect_shares_active_conversation(uuid, uuid) TO authenticated;

-- Directory roster: connect-eligible active peers; PII narrowed for non-Founder.
CREATE OR REPLACE FUNCTION public.connect_list_directory_peers(p_exclude_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  full_name text,
  username text,
  email text,
  access_level text,
  person_id text,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT
    p.id,
    p.full_name,
    p.username,
    CASE WHEN public.soda_is_domain_founder() THEN p.email ELSE NULL END,
    CASE WHEN public.soda_is_domain_founder() THEN p.access_level ELSE NULL END,
    p.person_id,
    p.is_active
  FROM public.profiles p
  WHERE coalesce(p.is_active, false) = true
    AND p.id IS DISTINCT FROM p_exclude_user_id
    AND public.connect_viewer_is_active()
    AND p.access_level IN ('founder', 'account_manager', 'team_leader', 'team')
  ORDER BY p.full_name ASC NULLS LAST;
$$;

REVOKE ALL ON FUNCTION public.connect_list_directory_peers(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.connect_list_directory_peers(uuid) TO authenticated;

-- Conversation/message context: peers the viewer may see (shared convo, self, or Founder).
CREATE OR REPLACE FUNCTION public.connect_get_peers_by_ids(p_peer_ids uuid[])
RETURNS TABLE (
  id uuid,
  full_name text,
  username text,
  email text,
  access_level text,
  person_id text,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT
    p.id,
    p.full_name,
    p.username,
    CASE
      WHEN public.soda_is_domain_founder()
        OR public.connect_shares_active_conversation(auth.uid(), p.id)
        OR p.id = auth.uid()
      THEN p.email
      ELSE NULL
    END,
    CASE WHEN public.soda_is_domain_founder() THEN p.access_level ELSE NULL END,
    p.person_id,
    p.is_active
  FROM public.profiles p
  WHERE p.id = ANY(p_peer_ids)
    AND coalesce(p.is_active, false) = true
    AND (
      public.soda_is_domain_founder()
      OR p.id = auth.uid()
      OR public.connect_shares_active_conversation(auth.uid(), p.id)
    );
$$;

REVOKE ALL ON FUNCTION public.connect_get_peers_by_ids(uuid[]) FROM public;
GRANT EXECUTE ON FUNCTION public.connect_get_peers_by_ids(uuid[]) TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS: remove company-wide peer enumeration on profiles
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS profiles_select_connect_peers ON public.profiles;
