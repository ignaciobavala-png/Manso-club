-- ============================================================
-- Migration: Extender multimedia_videos para soportar
-- YouTube, videos propios (MP4/WebM) e imágenes
-- ============================================================

-- 1. Agregar columnas tipo y archivo_url
ALTER TABLE multimedia_videos
  ADD COLUMN tipo text NOT NULL DEFAULT 'youtube'
    CHECK (tipo IN ('youtube', 'video', 'imagen')),
  ADD COLUMN archivo_url text;

-- 2. Hacer youtube_url nullable (solo necesario para tipo='youtube')
ALTER TABLE multimedia_videos
  ALTER COLUMN youtube_url DROP NOT NULL;

-- 3. Crear bucket para archivos multimedia
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'multimedia',
  'multimedia',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg']
)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage policies
DROP POLICY IF EXISTS "multimedia_public_read" ON storage.objects;
CREATE POLICY "multimedia_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'multimedia');

DROP POLICY IF EXISTS "multimedia_admin_insert" ON storage.objects;
CREATE POLICY "multimedia_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'multimedia' AND public.is_admin());

DROP POLICY IF EXISTS "multimedia_admin_update" ON storage.objects;
CREATE POLICY "multimedia_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'multimedia' AND public.is_admin())
  WITH CHECK (bucket_id = 'multimedia' AND public.is_admin());

DROP POLICY IF EXISTS "multimedia_admin_delete" ON storage.objects;
CREATE POLICY "multimedia_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'multimedia' AND public.is_admin());
