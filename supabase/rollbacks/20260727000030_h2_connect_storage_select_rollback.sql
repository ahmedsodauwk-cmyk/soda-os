-- Rollback H2 — restore pre-H2 Connect storage SELECT policy

DROP POLICY IF EXISTS connect_storage_select ON storage.objects;
CREATE POLICY connect_storage_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'connect' AND auth.uid() IS NOT NULL);
