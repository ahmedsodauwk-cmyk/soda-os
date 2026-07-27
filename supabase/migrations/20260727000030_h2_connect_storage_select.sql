-- H2 — Scope Connect storage SELECT to owner folder (audit 2026-07-16)

DROP POLICY IF EXISTS connect_storage_select ON storage.objects;
CREATE POLICY connect_storage_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'connect'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
