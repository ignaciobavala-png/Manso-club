-- Tabla para videos de Multimedia
CREATE TABLE multimedia_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  youtube_url text NOT NULL,
  descripcion text,
  orden integer DEFAULT 1,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE multimedia_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "multimedia_public_read" ON multimedia_videos
  FOR SELECT USING (true);

CREATE POLICY "multimedia_admin_write" ON multimedia_videos
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Tabla para propuestas de artistas
CREATE TABLE propuestas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  email text NOT NULL,
  tipo text NOT NULL DEFAULT 'artista',
  descripcion text NOT NULL,
  links text,
  revisado boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE propuestas ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede insertar (formulario público)
CREATE POLICY "propuestas_public_insert" ON propuestas
  FOR INSERT WITH CHECK (true);

-- Solo admins pueden leer
CREATE POLICY "propuestas_admin_read" ON propuestas
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "propuestas_admin_update" ON propuestas
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "propuestas_admin_delete" ON propuestas
  FOR DELETE TO authenticated
  USING (public.is_admin());
