-- ============================================================
-- FORO — Permitir a los usuarios borrar sus propios threads
-- (las replies ya lo permitían via foro_replies_delete)
-- ============================================================

DROP POLICY IF EXISTS "foro_threads_delete" ON foro_threads;
CREATE POLICY "foro_threads_delete" ON foro_threads
  FOR DELETE TO authenticated
  USING (
    autor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );
