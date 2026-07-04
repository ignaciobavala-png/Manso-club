-- ============================================================
-- Migration: Bucket "emails" para assets de campañas de mailing
--    - Lectura pública (imágenes referenciadas por URL en los mails)
--    - Upload/Update/Delete solo admin (dashboard)
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'emails',
  'emails',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "emails_public_read" ON storage.objects;
CREATE POLICY "emails_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'emails');

DROP POLICY IF EXISTS "emails_admin_insert" ON storage.objects;
CREATE POLICY "emails_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'emails' AND public.is_admin());

DROP POLICY IF EXISTS "emails_admin_update" ON storage.objects;
CREATE POLICY "emails_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'emails' AND public.is_admin())
  WITH CHECK (bucket_id = 'emails' AND public.is_admin());

DROP POLICY IF EXISTS "emails_admin_delete" ON storage.objects;
CREATE POLICY "emails_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'emails' AND public.is_admin());
