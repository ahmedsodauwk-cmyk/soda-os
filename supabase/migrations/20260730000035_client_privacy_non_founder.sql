-- Client privacy — non-Founder cannot SELECT client rows (order snapshots only).
-- NOT applied to Production by this mission. Rollback: rollback/20260730000035_client_privacy_non_founder_rollback.sql

CREATE OR REPLACE FUNCTION public.soda_can_access_client(p_client_id text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  IF public.soda_is_domain_founder() THEN
    RETURN true;
  END IF;

  -- Account Manager, Team Leader, Team: no client directory rows.
  -- Order-context whitelisted fields are served from order snapshots in app layer.
  RETURN false;
END;
$$;
