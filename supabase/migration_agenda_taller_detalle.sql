-- ============================================================
-- Manso Club — Página de detalle para talleres (agenda)
-- Agrega slug a "agenda" + tabla "agenda_fotos" para el carrusel
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Columna slug en agenda
CREATE EXTENSION IF NOT EXISTS unaccent;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agenda' AND column_name='slug') THEN
    ALTER TABLE agenda ADD COLUMN slug text;
  END IF;
END $$;

-- 2. Backfill de slugs para filas existentes que todavía no tengan uno
--    (mismo algoritmo de slugify que usa FormArtista.tsx sobre "nombre", aplicado a "titulo")
UPDATE agenda
SET slug = trim(both '-' from regexp_replace(lower(unaccent(titulo)), '[^a-z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Desambiguar slugs duplicados (por si dos talleres comparten título) agregando sufijo -2, -3, ...
WITH duplicados AS (
  SELECT id, slug,
         row_number() OVER (PARTITION BY slug ORDER BY created_at) AS rn
  FROM agenda
)
UPDATE agenda a
SET slug = d.slug || '-' || d.rn
FROM duplicados d
WHERE a.id = d.id AND d.rn > 1;

-- 3. Constraint UNIQUE + índice
ALTER TABLE agenda ADD CONSTRAINT agenda_slug_unique UNIQUE (slug);
CREATE INDEX IF NOT EXISTS idx_agenda_slug ON agenda (slug);

-- 4. Tabla agenda_fotos (galería/carrusel de cada taller)
CREATE TABLE IF NOT EXISTS agenda_fotos (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agenda_id   uuid NOT NULL REFERENCES agenda(id) ON DELETE CASCADE,
  url         text NOT NULL,
  orden       int NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agenda_fotos_agenda_id ON agenda_fotos (agenda_id);

-- 5. RLS para agenda_fotos — mismo patrón simple (admin-only) que la tabla "agenda"
ALTER TABLE agenda_fotos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agenda_fotos_public_read" ON agenda_fotos;
DROP POLICY IF EXISTS "agenda_fotos_auth_insert" ON agenda_fotos;
DROP POLICY IF EXISTS "agenda_fotos_auth_update" ON agenda_fotos;
DROP POLICY IF EXISTS "agenda_fotos_auth_delete" ON agenda_fotos;

CREATE POLICY "agenda_fotos_public_read"
  ON agenda_fotos FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "agenda_fotos_auth_insert"
  ON agenda_fotos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "agenda_fotos_auth_update"
  ON agenda_fotos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "agenda_fotos_auth_delete"
  ON agenda_fotos FOR DELETE
  TO authenticated
  USING (true);

-- 6. Bucket de Storage para las fotos de talleres
--    (crear "agenda-gallery" desde el dashboard de Supabase Storage si el proyecto
--    no gestiona buckets por SQL, o vía supabase-js/CLI storage.createBucket)
INSERT INTO storage.buckets (id, name, public)
VALUES ('agenda-gallery', 'agenda-gallery', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "agenda_gallery_public_read" ON storage.objects;
DROP POLICY IF EXISTS "agenda_gallery_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "agenda_gallery_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "agenda_gallery_auth_delete" ON storage.objects;

CREATE POLICY "agenda_gallery_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'agenda-gallery');

CREATE POLICY "agenda_gallery_auth_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'agenda-gallery');

CREATE POLICY "agenda_gallery_auth_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'agenda-gallery');

CREATE POLICY "agenda_gallery_auth_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'agenda-gallery');
