-- ============================================================
-- POLITICAS DE STORAGE: bucket "hero-media"
--    - Lectura publica (imagenes y videos del hero en frontend)
--    - Upload/Update/Delete solo autenticados (dashboard admin)
-- ============================================================

DROP POLICY IF EXISTS "hero_media_public_read" ON storage.objects;
DROP POLICY IF EXISTS "hero_media_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "hero_media_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "hero_media_auth_delete" ON storage.objects;

CREATE POLICY "hero_media_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'hero-media');

CREATE POLICY "hero_media_auth_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'hero-media');

CREATE POLICY "hero_media_auth_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'hero-media')
  WITH CHECK (bucket_id = 'hero-media');

CREATE POLICY "hero_media_auth_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'hero-media');

COMMENT ON POLICY "hero_media_public_read" ON storage.objects IS 'Permite lectura publica de imagenes y videos del hero';
COMMENT ON POLICY "hero_media_auth_upload" ON storage.objects IS 'Permite a admins subir imagenes/videos al hero';
COMMENT ON POLICY "hero_media_auth_update" ON storage.objects IS 'Permite a admins actualizar archivos del hero';
COMMENT ON POLICY "hero_media_auth_delete" ON storage.objects IS 'Permite a admins eliminar archivos del hero';
