-- Separa membresía (informativa) de permisos (acceso real a features)
-- permisos_totales: controla el acceso a contenido exclusivo, independiente de la membresía

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS permisos_totales BOOLEAN NOT NULL DEFAULT FALSE;

-- Actualizar storage RLS: acceso basado en permisos_totales (no membresia_activa)
DROP POLICY IF EXISTS "artist_member_upload" ON storage.objects;
DROP POLICY IF EXISTS "artist_member_update" ON storage.objects;
DROP POLICY IF EXISTS "artist_member_delete" ON storage.objects;

CREATE POLICY "artist_member_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'artist' AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND permisos_totales = true
    )
  );

CREATE POLICY "artist_member_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'artist' AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND permisos_totales = true
    )
  );

CREATE POLICY "artist_member_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'artist' AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND permisos_totales = true
    )
  );
