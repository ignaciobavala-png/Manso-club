-- ============================================================
-- MANSO CLUB - Politicas RLS + Auditoria completa
-- Ejecutar en Supabase SQL Editor (Dashboard > SQL Editor)
-- Fecha: 2025-02-16
-- ============================================================

-- ============================================================
-- 0. VERIFICAR TABLAS EXISTENTES (solo informativo)
-- ============================================================
-- Tablas esperadas:
--   artistas, productos, eventos_home, agenda, agenda_inscripciones
-- Buckets esperados:
--   flyers, artist

-- ============================================================
-- 1. HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================================

ALTER TABLE IF EXISTS artistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS eventos_home ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS agenda_inscripciones ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. LIMPIAR POLITICAS ANTERIORES (evitar duplicados)
-- ============================================================

-- artistas
DROP POLICY IF EXISTS "artistas_public_read" ON artistas;
DROP POLICY IF EXISTS "artistas_auth_insert" ON artistas;
DROP POLICY IF EXISTS "artistas_auth_update" ON artistas;
DROP POLICY IF EXISTS "artistas_auth_delete" ON artistas;

-- productos
DROP POLICY IF EXISTS "productos_public_read" ON productos;
DROP POLICY IF EXISTS "productos_auth_insert" ON productos;
DROP POLICY IF EXISTS "productos_auth_update" ON productos;
DROP POLICY IF EXISTS "productos_auth_delete" ON productos;

-- eventos_home
DROP POLICY IF EXISTS "eventos_home_public_read" ON eventos_home;
DROP POLICY IF EXISTS "eventos_home_auth_insert" ON eventos_home;
DROP POLICY IF EXISTS "eventos_home_auth_update" ON eventos_home;
DROP POLICY IF EXISTS "eventos_home_auth_delete" ON eventos_home;

-- agenda
DROP POLICY IF EXISTS "agenda_public_read" ON agenda;
DROP POLICY IF EXISTS "agenda_auth_insert" ON agenda;
DROP POLICY IF EXISTS "agenda_auth_update" ON agenda;
DROP POLICY IF EXISTS "agenda_auth_delete" ON agenda;

-- agenda_inscripciones
DROP POLICY IF EXISTS "inscripciones_public_insert" ON agenda_inscripciones;
DROP POLICY IF EXISTS "inscripciones_auth_read" ON agenda_inscripciones;
DROP POLICY IF EXISTS "inscripciones_auth_delete" ON agenda_inscripciones;

-- ============================================================
-- 3. POLITICAS PARA: artistas
--    - Lectura publica (frontend)
--    - Insert/Update/Delete solo autenticados (dashboard admin)
-- ============================================================

CREATE POLICY "artistas_public_read"
  ON artistas FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "artistas_auth_insert"
  ON artistas FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "artistas_auth_update"
  ON artistas FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "artistas_auth_delete"
  ON artistas FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- 4. POLITICAS PARA: productos
--    - Lectura publica (tienda)
--    - Insert/Update/Delete solo autenticados (dashboard admin)
-- ============================================================

CREATE POLICY "productos_public_read"
  ON productos FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "productos_auth_insert"
  ON productos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "productos_auth_update"
  ON productos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "productos_auth_delete"
  ON productos FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- 5. POLITICAS PARA: eventos_home
--    - Lectura publica (home page)
--    - Insert/Update/Delete solo autenticados (dashboard admin)
-- ============================================================

CREATE POLICY "eventos_home_public_read"
  ON eventos_home FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "eventos_home_auth_insert"
  ON eventos_home FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "eventos_home_auth_update"
  ON eventos_home FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "eventos_home_auth_delete"
  ON eventos_home FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- 6. POLITICAS PARA: agenda
--    - Lectura publica (pagina de agenda)
--    - Insert/Update/Delete solo autenticados (dashboard admin)
-- ============================================================

CREATE POLICY "agenda_public_read"
  ON agenda FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "agenda_auth_insert"
  ON agenda FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "agenda_auth_update"
  ON agenda FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "agenda_auth_delete"
  ON agenda FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- 7. POLITICAS PARA: agenda_inscripciones
--    - Insert publico (formulario de inscripcion del frontend)
--    - Lectura solo autenticados (dashboard admin ve inscriptos)
--    - Delete solo autenticados (admin puede limpiar)
-- ============================================================

CREATE POLICY "inscripciones_public_insert"
  ON agenda_inscripciones FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "inscripciones_auth_read"
  ON agenda_inscripciones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "inscripciones_auth_delete"
  ON agenda_inscripciones FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- 8. POLITICAS DE STORAGE: bucket "artist"
--    - Lectura publica (fotos de perfil en el frontend)
--    - Upload/Delete solo autenticados (dashboard admin)
-- ============================================================

DROP POLICY IF EXISTS "artist_public_read" ON storage.objects;
DROP POLICY IF EXISTS "artist_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "artist_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "artist_auth_delete" ON storage.objects;

CREATE POLICY "artist_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'artist');

CREATE POLICY "artist_auth_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'artist');

CREATE POLICY "artist_auth_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'artist')
  WITH CHECK (bucket_id = 'artist');

CREATE POLICY "artist_auth_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'artist');

-- ============================================================
-- 9. POLITICAS DE STORAGE: bucket "flyers"
--    - Lectura publica (imagenes de productos/eventos)
--    - Upload/Delete solo autenticados (dashboard admin)
-- ============================================================

DROP POLICY IF EXISTS "flyers_public_read" ON storage.objects;
DROP POLICY IF EXISTS "flyers_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "flyers_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "flyers_auth_delete" ON storage.objects;

CREATE POLICY "flyers_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'flyers');

CREATE POLICY "flyers_auth_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'flyers');

CREATE POLICY "flyers_auth_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'flyers')
  WITH CHECK (bucket_id = 'flyers');

CREATE POLICY "flyers_auth_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'flyers');

-- ============================================================
-- 10. AUDITORIA: Verificar estado final
-- ============================================================

-- Ver todas las tablas con RLS habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Ver todas las politicas activas en tablas publicas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Ver politicas de Storage
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- Contar registros por tabla (auditoria de datos)
SELECT 'artistas' AS tabla, COUNT(*) AS registros FROM artistas
UNION ALL
SELECT 'productos', COUNT(*) FROM productos
UNION ALL
SELECT 'eventos_home', COUNT(*) FROM eventos_home
UNION ALL
SELECT 'agenda', COUNT(*) FROM agenda
UNION ALL
SELECT 'agenda_inscripciones', COUNT(*) FROM agenda_inscripciones;

-- Ver buckets de Storage existentes
SELECT id, name, public, created_at
FROM storage.buckets
ORDER BY name;
