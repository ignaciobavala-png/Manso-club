-- ============================================================
-- FORO — Separar permisos de "escribir" (crear thread) y "comentar" (reply)
-- ============================================================
-- Bug: la policy de INSERT en foro_replies exigía permisos_totales,
-- la misma condición que crear un thread nuevo. Esto bloqueaba a
-- cualquier usuario logueado sin permisos_totales de poder comentar,
-- algo que debería estar permitido a todo usuario autenticado no baneado.
-- foro_threads_insert (crear post) se deja intacto: requiere permisos_totales.

DROP POLICY IF EXISTS "foro_replies_insert" ON foro_replies;
CREATE POLICY "foro_replies_insert" ON foro_replies
  FOR INSERT TO authenticated
  WITH CHECK (
    autor_id = auth.uid() AND
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND foro_baneado = false) AND
    EXISTS (SELECT 1 FROM foro_threads WHERE id = thread_id AND cerrado = false)
  );
