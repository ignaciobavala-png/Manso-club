-- ============================================================
-- Manso Club — Tabla "artistas"
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Crear la tabla (si no existe)
CREATE TABLE IF NOT EXISTS artistas (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre      text NOT NULL,
  slug        text NOT NULL UNIQUE,
  bio         text,
  estilo      text,                       -- géneros / etiqueta corta
  imagen_url  text,
  soundcloud_url text,                    -- URL principal de SoundCloud
  social_links jsonb DEFAULT '{}'::jsonb,  -- { instagram, spotify, soundcloud, ... }
  active      boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 2. Columnas que podrían faltar si la tabla ya existía
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='artistas' AND column_name='slug') THEN
    ALTER TABLE artistas ADD COLUMN slug text UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='artistas' AND column_name='estilo') THEN
    ALTER TABLE artistas ADD COLUMN estilo text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='artistas' AND column_name='soundcloud_url') THEN
    ALTER TABLE artistas ADD COLUMN soundcloud_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='artistas' AND column_name='social_links') THEN
    ALTER TABLE artistas ADD COLUMN social_links jsonb DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='artistas' AND column_name='active') THEN
    ALTER TABLE artistas ADD COLUMN active boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='artistas' AND column_name='updated_at') THEN
    ALTER TABLE artistas ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- 3. Índice para búsquedas por slug
CREATE INDEX IF NOT EXISTS idx_artistas_slug ON artistas (slug);

-- 4. RLS — lectura pública, escritura solo para admins autenticados
ALTER TABLE artistas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de artistas" ON artistas;
CREATE POLICY "Lectura pública de artistas"
  ON artistas FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin puede insertar artistas" ON artistas;
CREATE POLICY "Admin puede insertar artistas"
  ON artistas FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin puede actualizar artistas" ON artistas;
CREATE POLICY "Admin puede actualizar artistas"
  ON artistas FOR UPDATE
  USING (auth.role() = 'authenticated');
