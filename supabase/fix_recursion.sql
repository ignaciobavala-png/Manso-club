-- Fix: infinite recursion en user_profiles
-- Ejecutar TODO junto en Supabase SQL Editor

-- 1. Crear funcion is_admin que bypasea RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Eliminar la politica recursiva de user_profiles
DROP POLICY IF EXISTS "admins_read_all_profiles" ON user_profiles;

-- 3. Recrear politica de admins sin recursion (usa la funcion)
CREATE POLICY "admins_read_all_profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 4. Recrear politicas de artistas usando is_admin()
DROP POLICY IF EXISTS "artistas_auth_insert" ON artistas;
DROP POLICY IF EXISTS "artistas_auth_update" ON artistas;
DROP POLICY IF EXISTS "artistas_auth_delete" ON artistas;

CREATE POLICY "artistas_auth_insert"
  ON artistas FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "artistas_auth_update"
  ON artistas FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "artistas_auth_delete"
  ON artistas FOR DELETE TO authenticated
  USING (public.is_admin());

-- 5. Recrear politicas de productos usando is_admin()
DROP POLICY IF EXISTS "productos_auth_insert" ON productos;
DROP POLICY IF EXISTS "productos_auth_update" ON productos;
DROP POLICY IF EXISTS "productos_auth_delete" ON productos;

CREATE POLICY "productos_auth_insert"
  ON productos FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "productos_auth_update"
  ON productos FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "productos_auth_delete"
  ON productos FOR DELETE TO authenticated
  USING (public.is_admin());

-- 6. Recrear politicas de eventos_home usando is_admin()
DROP POLICY IF EXISTS "eventos_home_auth_insert" ON eventos_home;
DROP POLICY IF EXISTS "eventos_home_auth_update" ON eventos_home;
DROP POLICY IF EXISTS "eventos_home_auth_delete" ON eventos_home;

CREATE POLICY "eventos_home_auth_insert"
  ON eventos_home FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "eventos_home_auth_update"
  ON eventos_home FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "eventos_home_auth_delete"
  ON eventos_home FOR DELETE TO authenticated
  USING (public.is_admin());

-- 7. Recrear politicas de agenda usando is_admin()
DROP POLICY IF EXISTS "agenda_auth_insert" ON agenda;
DROP POLICY IF EXISTS "agenda_auth_update" ON agenda;
DROP POLICY IF EXISTS "agenda_auth_delete" ON agenda;

CREATE POLICY "agenda_auth_insert"
  ON agenda FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "agenda_auth_update"
  ON agenda FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "agenda_auth_delete"
  ON agenda FOR DELETE TO authenticated
  USING (public.is_admin());

-- 8. Recrear politicas de storage usando is_admin()
DROP POLICY IF EXISTS "artist_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "artist_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "artist_auth_delete" ON storage.objects;
DROP POLICY IF EXISTS "flyers_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "flyers_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "flyers_auth_delete" ON storage.objects;

CREATE POLICY "artist_auth_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'artist' AND public.is_admin());

CREATE POLICY "artist_auth_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'artist' AND public.is_admin())
  WITH CHECK (bucket_id = 'artist' AND public.is_admin());

CREATE POLICY "artist_auth_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'artist' AND public.is_admin());

CREATE POLICY "flyers_auth_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'flyers' AND public.is_admin());

CREATE POLICY "flyers_auth_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'flyers' AND public.is_admin())
  WITH CHECK (bucket_id = 'flyers' AND public.is_admin());

CREATE POLICY "flyers_auth_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'flyers' AND public.is_admin());
