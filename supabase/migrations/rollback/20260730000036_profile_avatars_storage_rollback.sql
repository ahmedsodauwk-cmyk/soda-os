-- Rollback profile avatars bucket policies

DROP POLICY IF EXISTS profile_avatars_select ON storage.objects;
DROP POLICY IF EXISTS profile_avatars_insert ON storage.objects;
DROP POLICY IF EXISTS profile_avatars_update ON storage.objects;
DROP POLICY IF EXISTS profile_avatars_delete ON storage.objects;

DELETE FROM storage.buckets WHERE id = 'profile-avatars';
