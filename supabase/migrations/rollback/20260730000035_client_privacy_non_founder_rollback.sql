-- Rollback client privacy — restore SR-01 team/TL client access via orders

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
