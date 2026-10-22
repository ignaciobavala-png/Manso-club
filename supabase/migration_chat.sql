-- ============================================================
-- CHAT — sala general + mensajes directos, en tiempo real
-- Solo texto. La identidad es la misma cuenta de la web (auth.uid()).
-- Tiempo real: Supabase Realtime (Postgres Changes) sobre chat_mensajes.
-- ============================================================

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS chat_baneado boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS chat_salas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('general', 'dm')),
  nombre text,
  -- "<uuid menor>:<uuid mayor>": impide dos DMs entre las mismas personas
  dm_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((tipo = 'dm') = (dm_key IS NOT NULL))
);

-- una sola sala general
CREATE UNIQUE INDEX IF NOT EXISTS chat_salas_una_general_idx
  ON chat_salas (tipo) WHERE tipo = 'general';

-- Los DMs tienen miembros explícitos. La sala general no: es de todos.
CREATE TABLE IF NOT EXISTS chat_miembros (
  sala_id uuid NOT NULL REFERENCES chat_salas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ultimo_leido_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (sala_id, user_id)
);

CREATE INDEX IF NOT EXISTS chat_miembros_user_idx ON chat_miembros(user_id);

CREATE TABLE IF NOT EXISTS chat_mensajes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id uuid NOT NULL REFERENCES chat_salas(id) ON DELETE CASCADE,
  autor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  autor_nombre text,
  cuerpo text NOT NULL CHECK (char_length(btrim(cuerpo)) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_mensajes_sala_fecha_idx
  ON chat_mensajes (sala_id, created_at DESC);

-- Sala general inicial
INSERT INTO chat_salas (tipo, nombre)
SELECT 'general', 'General'
WHERE NOT EXISTS (SELECT 1 FROM chat_salas WHERE tipo = 'general');

-- autor_nombre sale del perfil, no del cliente
CREATE OR REPLACE FUNCTION set_chat_autor_info()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT COALESCE(display_name, 'Usuario') INTO NEW.autor_nombre
  FROM user_profiles WHERE id = NEW.autor_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER chat_mensajes_set_autor
  BEFORE INSERT ON chat_mensajes
  FOR EACH ROW EXECUTE FUNCTION set_chat_autor_info();

-- Helpers SECURITY DEFINER: las políticas consultan chat_miembros y, si lo
-- hicieran directo, chat_miembros se consultaría a sí misma (recursión; ver
-- fix_recursion.sql).
CREATE OR REPLACE FUNCTION public.chat_es_miembro(p_sala uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM chat_salas s
    WHERE s.id = p_sala
      AND (
        s.tipo = 'general'
        OR EXISTS (SELECT 1 FROM chat_miembros m WHERE m.sala_id = s.id AND m.user_id = auth.uid())
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.chat_puede_escribir()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND chat_baneado = false
  );
$$;

-- Abre (o devuelve) el DM con otra persona
CREATE OR REPLACE FUNCTION public.chat_abrir_dm(p_otro uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_yo uuid := auth.uid();
  v_key text;
  v_sala uuid;
BEGIN
  IF v_yo IS NULL THEN RAISE EXCEPTION 'Sin sesión'; END IF;
  IF p_otro IS NULL OR p_otro = v_yo THEN RAISE EXCEPTION 'Destinatario inválido'; END IF;
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = p_otro) THEN
    RAISE EXCEPTION 'Destinatario inexistente';
  END IF;
  IF NOT chat_puede_escribir() THEN RAISE EXCEPTION 'No podés escribir en el chat'; END IF;

  v_key := LEAST(v_yo::text, p_otro::text) || ':' || GREATEST(v_yo::text, p_otro::text);

  SELECT id INTO v_sala FROM chat_salas WHERE dm_key = v_key;
  IF v_sala IS NULL THEN
    INSERT INTO chat_salas (tipo, dm_key) VALUES ('dm', v_key)
    ON CONFLICT (dm_key) DO NOTHING
    RETURNING id INTO v_sala;
    IF v_sala IS NULL THEN
      SELECT id INTO v_sala FROM chat_salas WHERE dm_key = v_key;
    END IF;
    INSERT INTO chat_miembros (sala_id, user_id)
    VALUES (v_sala, v_yo), (v_sala, p_otro)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN v_sala;
END;
$$;

REVOKE ALL ON FUNCTION public.chat_abrir_dm(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.chat_abrir_dm(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_es_miembro(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_puede_escribir() TO authenticated;

-- RLS
ALTER TABLE chat_salas ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_miembros ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_mensajes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_salas_lectura" ON chat_salas
  FOR SELECT TO authenticated USING (public.chat_es_miembro(id));

CREATE POLICY "chat_miembros_lectura" ON chat_miembros
  FOR SELECT TO authenticated USING (public.chat_es_miembro(sala_id));

-- solo para marcar leído el propio registro
CREATE POLICY "chat_miembros_update_propio" ON chat_miembros
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "chat_mensajes_lectura" ON chat_mensajes
  FOR SELECT TO authenticated USING (public.chat_es_miembro(sala_id));

CREATE POLICY "chat_mensajes_insert" ON chat_mensajes
  FOR INSERT TO authenticated
  WITH CHECK (
    autor_id = auth.uid()
    AND public.chat_es_miembro(sala_id)
    AND public.chat_puede_escribir()
  );

CREATE POLICY "chat_mensajes_delete" ON chat_mensajes
  FOR DELETE TO authenticated
  USING (autor_id = auth.uid() OR public.is_admin());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chat_mensajes;
