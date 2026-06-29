-- ============================================================
-- FORO — Threads y Replies para la comunidad Manso
-- ============================================================

CREATE TABLE IF NOT EXISTS foro_categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  slug text NOT NULL UNIQUE,
  descripcion text,
  orden integer NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS foro_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  cuerpo text NOT NULL,
  categoria_id uuid REFERENCES foro_categorias(id) ON DELETE SET NULL,
  autor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  autor_nombre text,
  autor_avatar text,
  pinned boolean NOT NULL DEFAULT false,
  cerrado boolean NOT NULL DEFAULT false,
  views integer NOT NULL DEFAULT 0,
  reply_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS foro_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES foro_threads(id) ON DELETE CASCADE,
  cuerpo text NOT NULL,
  autor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  autor_nombre text,
  autor_avatar text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS foro_threads_categoria_id_idx ON foro_threads(categoria_id);
CREATE INDEX IF NOT EXISTS foro_threads_created_at_idx ON foro_threads(created_at DESC);
CREATE INDEX IF NOT EXISTS foro_replies_thread_id_idx ON foro_replies(thread_id);
CREATE INDEX IF NOT EXISTS foro_replies_created_at_idx ON foro_replies(created_at);

-- TRIGGER: poblar autor_nombre/autor_avatar desde user_profiles al insertar
CREATE OR REPLACE FUNCTION set_foro_autor_info()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT display_name, avatar_url
  INTO NEW.autor_nombre, NEW.autor_avatar
  FROM user_profiles
  WHERE id = NEW.autor_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER foro_threads_set_autor
  BEFORE INSERT ON foro_threads
  FOR EACH ROW EXECUTE FUNCTION set_foro_autor_info();

CREATE OR REPLACE TRIGGER foro_replies_set_autor
  BEFORE INSERT ON foro_replies
  FOR EACH ROW EXECUTE FUNCTION set_foro_autor_info();

-- TRIGGER: mantener reply_count en foro_threads
CREATE OR REPLACE FUNCTION update_thread_reply_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE foro_threads SET reply_count = reply_count + 1, updated_at = now()
    WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE foro_threads SET reply_count = GREATEST(reply_count - 1, 0)
    WHERE id = OLD.thread_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE TRIGGER foro_replies_update_count
  AFTER INSERT OR DELETE ON foro_replies
  FOR EACH ROW EXECUTE FUNCTION update_thread_reply_count();

-- FUNCIÓN: incrementar views de forma atómica
CREATE OR REPLACE FUNCTION increment_thread_views(p_thread_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE foro_threads SET views = views + 1 WHERE id = p_thread_id;
$$;

GRANT EXECUTE ON FUNCTION increment_thread_views TO anon, authenticated;

-- RLS
ALTER TABLE foro_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE foro_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE foro_replies ENABLE ROW LEVEL SECURITY;

-- foro_categorias
CREATE POLICY "foro_categorias_lectura" ON foro_categorias
  FOR SELECT TO anon, authenticated USING (activo = true);

CREATE POLICY "foro_categorias_admin" ON foro_categorias
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- foro_threads
CREATE POLICY "foro_threads_lectura" ON foro_threads
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "foro_threads_insert" ON foro_threads
  FOR INSERT TO authenticated
  WITH CHECK (
    autor_id = auth.uid() AND
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND permisos_totales = true)
  );

CREATE POLICY "foro_threads_update" ON foro_threads
  FOR UPDATE TO authenticated
  USING (
    autor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    autor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "foro_threads_delete" ON foro_threads
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- foro_replies
CREATE POLICY "foro_replies_lectura" ON foro_replies
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "foro_replies_insert" ON foro_replies
  FOR INSERT TO authenticated
  WITH CHECK (
    autor_id = auth.uid() AND
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND permisos_totales = true) AND
    EXISTS (SELECT 1 FROM foro_threads WHERE id = thread_id AND cerrado = false)
  );

CREATE POLICY "foro_replies_update" ON foro_replies
  FOR UPDATE TO authenticated
  USING (autor_id = auth.uid())
  WITH CHECK (autor_id = auth.uid());

CREATE POLICY "foro_replies_delete" ON foro_replies
  FOR DELETE TO authenticated
  USING (
    autor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- SEED: categorías iniciales
INSERT INTO foro_categorias (nombre, slug, descripcion, orden) VALUES
  ('General', 'general', 'Conversaciones generales de la comunidad', 0),
  ('Música', 'musica', 'Novedades, proyectos y escucha colectiva', 1),
  ('Eventos', 'eventos', 'Charlas sobre los eventos y actividades de Manso', 2),
  ('Anuncios', 'anuncios', 'Comunicados del equipo de Manso', 3)
ON CONFLICT (slug) DO NOTHING;
