-- ============================================================
-- FORO — Moderación: reportes, baneo a nivel foro
-- ============================================================

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS foro_baneado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS foro_baneado_motivo text,
  ADD COLUMN IF NOT EXISTS foro_baneado_at timestamptz;

CREATE TABLE IF NOT EXISTS foro_reportes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid REFERENCES foro_threads(id) ON DELETE CASCADE,
  reply_id uuid REFERENCES foro_replies(id) ON DELETE CASCADE,
  reportado_por uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  motivo text NOT NULL,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','resuelto','descartado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resuelto_por uuid REFERENCES auth.users(id),
  resuelto_at timestamptz,
  CHECK (
    (thread_id IS NOT NULL AND reply_id IS NULL) OR
    (thread_id IS NULL AND reply_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS foro_reportes_estado_idx ON foro_reportes(estado);

ALTER TABLE foro_reportes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "foro_reportes_insert" ON foro_reportes
  FOR INSERT TO authenticated
  WITH CHECK (reportado_por = auth.uid());

CREATE POLICY "foro_reportes_admin_select" ON foro_reportes
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "foro_reportes_admin_update" ON foro_reportes
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- Reforzar RLS existentes: usuario baneado no puede escribir (defensa en profundidad,
-- ya que la página también lo valida)
DROP POLICY IF EXISTS "foro_threads_insert" ON foro_threads;
CREATE POLICY "foro_threads_insert" ON foro_threads
  FOR INSERT TO authenticated
  WITH CHECK (
    autor_id = auth.uid() AND
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND permisos_totales = true AND foro_baneado = false)
  );

DROP POLICY IF EXISTS "foro_replies_insert" ON foro_replies;
CREATE POLICY "foro_replies_insert" ON foro_replies
  FOR INSERT TO authenticated
  WITH CHECK (
    autor_id = auth.uid() AND
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND permisos_totales = true AND foro_baneado = false) AND
    EXISTS (SELECT 1 FROM foro_threads WHERE id = thread_id AND cerrado = false)
  );

DROP POLICY IF EXISTS "foro_reacciones_insert" ON foro_reacciones;
CREATE POLICY "foro_reacciones_insert" ON foro_reacciones
  FOR INSERT TO authenticated
  WITH CHECK (
    autor_id = auth.uid() AND
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND foro_baneado = false)
  );
