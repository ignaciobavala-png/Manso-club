CREATE TABLE IF NOT EXISTS foro_reacciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid REFERENCES foro_threads(id) ON DELETE CASCADE,
  reply_id uuid REFERENCES foro_replies(id) ON DELETE CASCADE,
  autor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (emoji IN ('heart', 'fire', 'clap')),
  CHECK (
    (thread_id IS NOT NULL AND reply_id IS NULL) OR
    (thread_id IS NULL AND reply_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX foro_reacciones_thread_unique
  ON foro_reacciones(thread_id, autor_id, emoji) WHERE thread_id IS NOT NULL;

CREATE UNIQUE INDEX foro_reacciones_reply_unique
  ON foro_reacciones(reply_id, autor_id, emoji) WHERE reply_id IS NOT NULL;

CREATE INDEX foro_reacciones_thread_id_idx ON foro_reacciones(thread_id);
CREATE INDEX foro_reacciones_reply_id_idx ON foro_reacciones(reply_id);

ALTER TABLE foro_reacciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "foro_reacciones_lectura" ON foro_reacciones
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "foro_reacciones_insert" ON foro_reacciones
  FOR INSERT TO authenticated
  WITH CHECK (autor_id = auth.uid());

CREATE POLICY "foro_reacciones_delete" ON foro_reacciones
  FOR DELETE TO authenticated
  USING (autor_id = auth.uid());
