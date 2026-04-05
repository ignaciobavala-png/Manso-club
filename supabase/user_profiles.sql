-- ============================================================
-- MANSO CLUB - Tabla user_profiles + Roles + RLS
-- EJECUTAR EN 3 PASOS SEPARADOS EN SUPABASE SQL EDITOR
-- ============================================================


-- ===========================================
-- PASO 1: Copiar y ejecutar SOLO esto primero
-- ===========================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'member');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'member',
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'member')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ===========================================
-- PASO 2: Copiar y ejecutar SOLO esto segundo
-- (politicas de user_profiles + tablas admin)
-- ===========================================

DROP POLICY IF EXISTS "users_read_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "admins_read_all_profiles" ON user_profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON user_profiles;

CREATE POLICY "users_read_own_profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "admins_read_all_profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "users_update_own_profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "artistas_auth_insert" ON artistas;
DROP POLICY IF EXISTS "artistas_auth_update" ON artistas;
DROP POLICY IF EXISTS "artistas_auth_delete" ON artistas;

CREATE POLICY "artistas_auth_insert"
  ON artistas FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "artistas_auth_update"
  ON artistas FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "artistas_auth_delete"
  ON artistas FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "productos_auth_insert" ON productos;
DROP POLICY IF EXISTS "productos_auth_update" ON productos;
DROP POLICY IF EXISTS "productos_auth_delete" ON productos;

CREATE POLICY "productos_auth_insert"
  ON productos FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "productos_auth_update"
  ON productos FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "productos_auth_delete"
  ON productos FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "eventos_home_auth_insert" ON eventos_home;
DROP POLICY IF EXISTS "eventos_home_auth_update" ON eventos_home;
DROP POLICY IF EXISTS "eventos_home_auth_delete" ON eventos_home;

CREATE POLICY "eventos_home_auth_insert"
  ON eventos_home FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "eventos_home_auth_update"
  ON eventos_home FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "eventos_home_auth_delete"
  ON eventos_home FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "agenda_auth_insert" ON agenda;
DROP POLICY IF EXISTS "agenda_auth_update" ON agenda;
DROP POLICY IF EXISTS "agenda_auth_delete" ON agenda;

CREATE POLICY "agenda_auth_insert"
  ON agenda FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "agenda_auth_update"
  ON agenda FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "agenda_auth_delete"
  ON agenda FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "artist_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "artist_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "artist_auth_delete" ON storage.objects;
DROP POLICY IF EXISTS "flyers_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "flyers_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "flyers_auth_delete" ON storage.objects;

CREATE POLICY "artist_auth_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'artist' AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "artist_auth_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'artist' AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (bucket_id = 'artist' AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "artist_auth_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'artist' AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "flyers_auth_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'flyers' AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "flyers_auth_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'flyers' AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (bucket_id = 'flyers' AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "flyers_auth_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'flyers' AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));


-- ===========================================
-- PASO 3: Copiar y ejecutar SOLO esto tercero
-- CAMBIA TU_EMAIL@ejemplo.com por tu email real
-- ===========================================

INSERT INTO user_profiles (id, email, role)
SELECT id, email, 'admin'::user_role
FROM auth.users
WHERE email = 'TU_EMAIL@ejemplo.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin'::user_role;

SELECT id, email, role, created_at FROM user_profiles ORDER BY created_at;
