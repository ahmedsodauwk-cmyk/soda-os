-- Profile avatars storage bucket (local / isolated env only — NOT applied to Production by this mission).
-- Rollback: rollback/20260730000036_profile_avatars_storage_rollback.sql

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-avatars', 'profile-avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS profile_avatars_select ON storage.objects;
CREATE POLICY profile_avatars_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'profile-avatars');

DROP POLICY IF EXISTS profile_avatars_insert ON storage.objects;
CREATE POLICY profile_avatars_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS profile_avatars_update ON storage.objects;
CREATE POLICY profile_avatars_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS profile_avatars_delete ON storage.objects;
CREATE POLICY profile_avatars_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'profile-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
