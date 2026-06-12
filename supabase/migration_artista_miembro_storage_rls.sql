-- Permite a miembros activos subir imágenes al bucket 'artist'
-- Los admins ya tienen acceso; esto extiende el permiso a miembros

DROP POLICY IF EXISTS "artist_member_upload" ON storage.objects;
DROP POLICY IF EXISTS "artist_member_update" ON storage.objects;
DROP POLICY IF EXISTS "artist_member_delete" ON storage.objects;

CREATE POLICY "artist_member_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'artist' AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND membresia_activa = true
        AND (membresia_hasta IS NULL OR membresia_hasta > now())
    )
  );

CREATE POLICY "artist_member_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'artist' AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND membresia_activa = true
        AND (membresia_hasta IS NULL OR membresia_hasta > now())
    )
  );

CREATE POLICY "artist_member_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'artist' AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND membresia_activa = true
        AND (membresia_hasta IS NULL OR membresia_hasta > now())
    )
  );

-- RLS para artista_fotos: miembro solo toca sus propias fotos
ALTER TABLE artista_fotos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_artista_fotos" ON artista_fotos;
DROP POLICY IF EXISTS "member_insert_own_fotos" ON artista_fotos;
DROP POLICY IF EXISTS "member_delete_own_fotos" ON artista_fotos;
DROP POLICY IF EXISTS "member_update_own_fotos" ON artista_fotos;

CREATE POLICY "public_read_artista_fotos"
  ON artista_fotos FOR SELECT
  USING (true);

CREATE POLICY "member_insert_own_fotos"
  ON artista_fotos FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM artistas
      WHERE id = artista_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "member_update_own_fotos"
  ON artista_fotos FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM artistas
      WHERE id = artista_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "member_delete_own_fotos"
  ON artista_fotos FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM artistas
      WHERE id = artista_id AND user_id = auth.uid()
    )
  );

-- RLS para artistas_tracks: mismo patrón
ALTER TABLE artistas_tracks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_artistas_tracks" ON artistas_tracks;
DROP POLICY IF EXISTS "member_insert_own_tracks" ON artistas_tracks;
DROP POLICY IF EXISTS "member_update_own_tracks" ON artistas_tracks;
DROP POLICY IF EXISTS "member_delete_own_tracks" ON artistas_tracks;

CREATE POLICY "public_read_artistas_tracks"
  ON artistas_tracks FOR SELECT
  USING (true);

CREATE POLICY "member_insert_own_tracks"
  ON artistas_tracks FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM artistas
      WHERE id = artista_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "member_update_own_tracks"
  ON artistas_tracks FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM artistas
      WHERE id = artista_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "member_delete_own_tracks"
  ON artistas_tracks FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM artistas
      WHERE id = artista_id AND user_id = auth.uid()
    )
  );
