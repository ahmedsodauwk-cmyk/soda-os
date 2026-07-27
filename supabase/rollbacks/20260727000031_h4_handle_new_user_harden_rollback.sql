-- Rollback H4 — restore pre-H4 handle_new_user (accepts privileged metadata roles)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chosen_role text;
  existing_count int;
  meta_role text;
  chosen_username text;
  force_pw boolean;
BEGIN
  SELECT count(*) INTO existing_count FROM public.profiles;
  meta_role := coalesce(new.raw_user_meta_data->>'role', '');
  IF existing_count = 0 THEN
    chosen_role := 'owner';
  ELSIF meta_role IN (
    'owner', 'admin', 'team_leader', 'crew_member', 'accountant', 'client',
    'founder', 'project_manager', 'photographer', 'videographer',
    'photo_editor', 'video_editor', 'sales', 'customer_service',
    'social_media_manager', 'freelancer', 'guest'
  ) THEN
    chosen_role := meta_role;
  ELSE
    chosen_role := 'crew_member';
  END IF;

  chosen_username := lower(coalesce(
    nullif(trim(new.raw_user_meta_data->>'username'), ''),
    split_part(coalesce(new.email, ''), '@', 1)
  ));

  force_pw := coalesce((new.raw_user_meta_data->>'must_change_password')::boolean, false);

  INSERT INTO public.profiles (
    id, email, full_name, role, is_active, username, must_change_password
  )
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    chosen_role,
    true,
    nullif(chosen_username, ''),
    force_pw
  )
  ON CONFLICT (id) DO UPDATE SET
    email = excluded.email,
    username = coalesce(public.profiles.username, excluded.username),
    updated_at = now();

  RETURN new;
END;
$$;
