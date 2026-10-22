-- ============================================================
-- CHAT v2 — salas públicas y privadas con clave, reacciones, respuestas,
-- antiflood y limpieza automática de mensajes viejos.
-- Todo lo administrativo pasa por funciones SECURITY DEFINER que comprueban
-- is_admin(): así el admin no necesita policies que le abran los DMs.
-- ============================================================

-- ---------- Salas ----------
ALTER TABLE chat_salas DROP CONSTRAINT IF EXISTS chat_salas_tipo_check;
ALTER TABLE chat_salas
  ADD CONSTRAINT chat_salas_tipo_check CHECK (tipo IN ('general', 'dm', 'publica', 'privada'));

ALTER TABLE chat_salas
  ADD COLUMN IF NOT EXISTS descripcion text,
  ADD COLUMN IF NOT EXISTS retencion_dias integer
    CHECK (retencion_dias IS NULL OR retencion_dias BETWEEN 1 AND 3650),
  ADD COLUMN IF NOT EXISTS creada_por uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS chat_salas_nombre_idx
  ON chat_salas (lower(nombre)) WHERE tipo IN ('publica', 'privada');

-- Clave de las salas privadas: tabla aparte porque la RLS es por fila y chat_salas
-- la leen todos los miembros. Solo el admin la ve.
CREATE TABLE IF NOT EXISTS chat_salas_claves (
  sala_id uuid PRIMARY KEY REFERENCES chat_salas(id) ON DELETE CASCADE,
  clave text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE chat_salas_claves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_claves_admin" ON chat_salas_claves
  FOR SELECT TO authenticated USING (public.is_admin());

-- Retención global (una sola fila)
CREATE TABLE IF NOT EXISTS chat_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  retencion_dias integer NOT NULL DEFAULT 30 CHECK (retencion_dias BETWEEN 1 AND 3650)
);
INSERT INTO chat_config DEFAULT VALUES ON CONFLICT DO NOTHING;
ALTER TABLE chat_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_config_lectura" ON chat_config FOR SELECT TO authenticated USING (true);

-- Intentos fallidos de clave (freno de fuerza bruta). Sin policies: solo las funciones.
CREATE TABLE IF NOT EXISTS chat_intentos (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_intentos_user_idx ON chat_intentos (user_id, created_at);
ALTER TABLE chat_intentos ENABLE ROW LEVEL SECURITY;

-- Quién entra a qué: general y públicas son de todos; DMs y privadas, de sus miembros
CREATE OR REPLACE FUNCTION public.chat_es_miembro(p_sala uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM chat_salas s
    WHERE s.id = p_sala
      AND (
        s.tipo IN ('general', 'publica')
        OR EXISTS (SELECT 1 FROM chat_miembros m WHERE m.sala_id = s.id AND m.user_id = auth.uid())
      )
  );
$$;

-- ---------- Mensajes: respuestas y antiflood ----------
ALTER TABLE chat_mensajes
  ADD COLUMN IF NOT EXISTS responde_a uuid REFERENCES chat_mensajes(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.chat_respuesta_valida(p_resp uuid, p_sala uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT p_resp IS NULL
      OR EXISTS (SELECT 1 FROM chat_mensajes r WHERE r.id = p_resp AND r.sala_id = p_sala);
$$;
GRANT EXECUTE ON FUNCTION public.chat_respuesta_valida(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "chat_mensajes_insert" ON chat_mensajes;
CREATE POLICY "chat_mensajes_insert" ON chat_mensajes
  FOR INSERT TO authenticated
  WITH CHECK (
    autor_id = auth.uid()
    AND public.chat_es_miembro(sala_id)
    AND public.chat_puede_escribir()
    AND public.chat_respuesta_valida(responde_a, sala_id)
  );

CREATE OR REPLACE FUNCTION chat_antiflood()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT count(*) FROM chat_mensajes
      WHERE autor_id = NEW.autor_id AND created_at > now() - interval '10 seconds') >= 12 THEN
    RAISE EXCEPTION 'Estás mandando mensajes muy rápido';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER chat_mensajes_antiflood
  BEFORE INSERT ON chat_mensajes
  FOR EACH ROW EXECUTE FUNCTION chat_antiflood();

-- ---------- Reacciones ----------
CREATE TABLE IF NOT EXISTS chat_reacciones (
  mensaje_id uuid NOT NULL REFERENCES chat_mensajes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL CHECK (emoji IN ('👍', '🔥', '😂', '🙌', '👀', '💜')),
  sala_id uuid NOT NULL REFERENCES chat_salas(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (mensaje_id, user_id, emoji)
);
CREATE INDEX IF NOT EXISTS chat_reacciones_sala_idx ON chat_reacciones (sala_id);

-- la sala sale del mensaje, no del cliente
CREATE OR REPLACE FUNCTION chat_reaccion_sala()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT sala_id INTO NEW.sala_id FROM chat_mensajes WHERE id = NEW.mensaje_id;
  IF NEW.sala_id IS NULL THEN RAISE EXCEPTION 'Mensaje inexistente'; END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER chat_reacciones_sala
  BEFORE INSERT ON chat_reacciones
  FOR EACH ROW EXECUTE FUNCTION chat_reaccion_sala();

ALTER TABLE chat_reacciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_reacciones_lectura" ON chat_reacciones
  FOR SELECT TO authenticated USING (public.chat_es_miembro(sala_id));
CREATE POLICY "chat_reacciones_insert" ON chat_reacciones
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.chat_es_miembro(sala_id) AND public.chat_puede_escribir());
CREATE POLICY "chat_reacciones_delete" ON chat_reacciones
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ---------- Crear, entrar y salir de salas ----------
CREATE OR REPLACE FUNCTION public.chat_crear_sala(p_nombre text, p_descripcion text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_yo uuid := auth.uid();
  v_nombre text := btrim(coalesce(p_nombre, ''));
  v_sala uuid;
BEGIN
  IF v_yo IS NULL THEN RAISE EXCEPTION 'Sin sesión'; END IF;
  IF NOT chat_puede_escribir() THEN RAISE EXCEPTION 'No podés crear salas'; END IF;
  IF char_length(v_nombre) NOT BETWEEN 2 AND 40 THEN
    RAISE EXCEPTION 'El nombre tiene que tener entre 2 y 40 caracteres';
  END IF;
  IF NOT is_admin() AND (SELECT count(*) FROM chat_salas WHERE creada_por = v_yo AND tipo = 'publica') >= 5 THEN
    RAISE EXCEPTION 'Ya creaste el máximo de salas (5)';
  END IF;
  IF EXISTS (SELECT 1 FROM chat_salas WHERE lower(nombre) = lower(v_nombre) AND tipo IN ('publica', 'privada', 'general')) THEN
    RAISE EXCEPTION 'Ya existe una sala con ese nombre';
  END IF;

  INSERT INTO chat_salas (tipo, nombre, descripcion, creada_por)
  VALUES ('publica', v_nombre, nullif(btrim(coalesce(p_descripcion, '')), ''), v_yo)
  RETURNING id INTO v_sala;
  RETURN v_sala;
END;
$$;

-- Admin: sala privada con clave (generada si no se pasa una)
CREATE OR REPLACE FUNCTION public.chat_admin_crear_privada(
  p_nombre text, p_descripcion text DEFAULT NULL, p_clave text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nombre text := btrim(coalesce(p_nombre, ''));
  v_clave text;
  v_sala uuid;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Solo admin'; END IF;
  IF char_length(v_nombre) NOT BETWEEN 2 AND 40 THEN
    RAISE EXCEPTION 'El nombre tiene que tener entre 2 y 40 caracteres';
  END IF;
  IF EXISTS (SELECT 1 FROM chat_salas WHERE lower(nombre) = lower(v_nombre) AND tipo IN ('publica', 'privada', 'general')) THEN
    RAISE EXCEPTION 'Ya existe una sala con ese nombre';
  END IF;

  IF p_clave IS NULL OR btrim(p_clave) = '' THEN
    v_clave := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  ELSE
    v_clave := upper(regexp_replace(p_clave, '[^0-9A-Za-z]', '', 'g'));
    IF char_length(v_clave) < 6 THEN RAISE EXCEPTION 'La clave necesita al menos 6 letras o números'; END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM chat_salas_claves WHERE clave = v_clave) THEN
    RAISE EXCEPTION 'Esa clave ya la usa otra sala';
  END IF;

  INSERT INTO chat_salas (tipo, nombre, descripcion, creada_por)
  VALUES ('privada', v_nombre, nullif(btrim(coalesce(p_descripcion, '')), ''), auth.uid())
  RETURNING id INTO v_sala;
  INSERT INTO chat_salas_claves (sala_id, clave) VALUES (v_sala, v_clave);
  INSERT INTO chat_miembros (sala_id, user_id) VALUES (v_sala, auth.uid());
  RETURN jsonb_build_object('id', v_sala, 'clave', v_clave);
END;
$$;

-- Entrar a una sala privada con su clave. Los fallos no levantan excepción:
-- si lo hicieran, el rollback borraría el registro del intento.
CREATE OR REPLACE FUNCTION public.chat_entrar_con_clave(p_clave text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_yo uuid := auth.uid();
  v_clave text := upper(regexp_replace(coalesce(p_clave, ''), '[^0-9A-Za-z]', '', 'g'));
  v_sala uuid;
BEGIN
  IF v_yo IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Sin sesión'); END IF;
  IF NOT chat_puede_escribir() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No podés entrar a salas');
  END IF;
  IF (SELECT count(*) FROM chat_intentos WHERE user_id = v_yo AND created_at > now() - interval '10 minutes') >= 8 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Demasiados intentos. Probá de nuevo en unos minutos.');
  END IF;

  SELECT sala_id INTO v_sala FROM chat_salas_claves WHERE clave = v_clave;
  IF v_sala IS NULL THEN
    INSERT INTO chat_intentos (user_id) VALUES (v_yo);
    RETURN jsonb_build_object('ok', false, 'error', 'Esa clave no corresponde a ninguna sala');
  END IF;

  INSERT INTO chat_miembros (sala_id, user_id) VALUES (v_sala, v_yo) ON CONFLICT DO NOTHING;
  RETURN jsonb_build_object('ok', true, 'sala_id', v_sala);
END;
$$;

CREATE OR REPLACE FUNCTION public.chat_salir(p_sala uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM chat_salas WHERE id = p_sala AND tipo = 'privada') THEN
    RAISE EXCEPTION 'Solo se puede salir de salas privadas';
  END IF;
  DELETE FROM chat_miembros WHERE sala_id = p_sala AND user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.chat_eliminar_sala(p_sala uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM chat_salas s
    WHERE s.id = p_sala AND s.tipo IN ('publica', 'privada')
      AND (is_admin() OR (s.tipo = 'publica' AND s.creada_por = auth.uid()))
  ) THEN
    RAISE EXCEPTION 'No podés eliminar esta sala';
  END IF;
  DELETE FROM chat_salas WHERE id = p_sala;
END;
$$;

-- Resumen para la lista: último mensaje de cada sala visible (corre con la RLS de quien llama)
CREATE OR REPLACE FUNCTION public.chat_resumen()
RETURNS TABLE (sala_id uuid, cuerpo text, autor_nombre text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT DISTINCT ON (m.sala_id) m.sala_id, m.cuerpo, m.autor_nombre, m.created_at
  FROM chat_mensajes m
  ORDER BY m.sala_id, m.created_at DESC;
$$;

-- ---------- Admin ----------
CREATE OR REPLACE FUNCTION public.chat_admin_salas()
RETURNS TABLE (
  id uuid, tipo text, nombre text, descripcion text, retencion_dias integer,
  created_at timestamptz, clave text, miembros integer, mensajes bigint
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Solo admin'; END IF;
  RETURN QUERY
    SELECT s.id, s.tipo, s.nombre, s.descripcion, s.retencion_dias, s.created_at, k.clave,
           (SELECT count(*) FROM chat_miembros m WHERE m.sala_id = s.id)::integer,
           (SELECT count(*) FROM chat_mensajes x WHERE x.sala_id = s.id)::bigint
    FROM chat_salas s
    LEFT JOIN chat_salas_claves k ON k.sala_id = s.id
    WHERE s.tipo <> 'dm'
    ORDER BY s.created_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.chat_admin_miembros(p_sala uuid)
RETURNS TABLE (user_id uuid, nombre text)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Solo admin'; END IF;
  RETURN QUERY
    SELECT m.user_id, coalesce(p.display_name, p.email, 'Usuario')
    FROM chat_miembros m JOIN user_profiles p ON p.id = m.user_id
    WHERE m.sala_id = p_sala
    ORDER BY 2;
END;
$$;

CREATE OR REPLACE FUNCTION public.chat_admin_expulsar(p_sala uuid, p_user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Solo admin'; END IF;
  DELETE FROM chat_miembros m USING chat_salas s
  WHERE m.sala_id = p_sala AND m.user_id = p_user AND s.id = m.sala_id AND s.tipo = 'privada';
END;
$$;

CREATE OR REPLACE FUNCTION public.chat_admin_regenerar_clave(p_sala uuid, p_clave text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_clave text;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Solo admin'; END IF;
  IF NOT EXISTS (SELECT 1 FROM chat_salas WHERE id = p_sala AND tipo = 'privada') THEN
    RAISE EXCEPTION 'La sala no es privada';
  END IF;
  IF p_clave IS NULL OR btrim(p_clave) = '' THEN
    v_clave := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  ELSE
    v_clave := upper(regexp_replace(p_clave, '[^0-9A-Za-z]', '', 'g'));
    IF char_length(v_clave) < 6 THEN RAISE EXCEPTION 'La clave necesita al menos 6 letras o números'; END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM chat_salas_claves WHERE clave = v_clave AND sala_id <> p_sala) THEN
    RAISE EXCEPTION 'Esa clave ya la usa otra sala';
  END IF;
  UPDATE chat_salas_claves SET clave = v_clave WHERE sala_id = p_sala;
  RETURN v_clave;
END;
$$;

CREATE OR REPLACE FUNCTION public.chat_admin_sala_set(
  p_sala uuid, p_nombre text, p_descripcion text, p_retencion integer
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_nombre text := btrim(coalesce(p_nombre, ''));
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Solo admin'; END IF;
  IF char_length(v_nombre) NOT BETWEEN 2 AND 40 THEN
    RAISE EXCEPTION 'El nombre tiene que tener entre 2 y 40 caracteres';
  END IF;
  IF EXISTS (
    SELECT 1 FROM chat_salas
    WHERE lower(nombre) = lower(v_nombre) AND tipo IN ('publica', 'privada', 'general') AND id <> p_sala
  ) THEN RAISE EXCEPTION 'Ya existe una sala con ese nombre'; END IF;
  UPDATE chat_salas
  SET nombre = v_nombre,
      descripcion = nullif(btrim(coalesce(p_descripcion, '')), ''),
      retencion_dias = p_retencion
  WHERE id = p_sala AND tipo <> 'dm';
END;
$$;

CREATE OR REPLACE FUNCTION public.chat_admin_config_set(p_dias integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Solo admin'; END IF;
  UPDATE chat_config SET retencion_dias = p_dias;
END;
$$;

CREATE OR REPLACE FUNCTION public.chat_admin_silenciar(p_user uuid, p_silenciar boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Solo admin'; END IF;
  UPDATE user_profiles SET chat_baneado = p_silenciar WHERE id = p_user AND role <> 'admin';
END;
$$;

-- ---------- Limpieza de mensajes viejos ----------
CREATE OR REPLACE FUNCTION public.chat_purgar()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_def integer; n integer;
BEGIN
  SELECT retencion_dias INTO v_def FROM chat_config LIMIT 1;
  DELETE FROM chat_mensajes m USING chat_salas s
  WHERE s.id = m.sala_id
    AND m.created_at < now() - make_interval(days => coalesce(s.retencion_dias, v_def, 30));
  GET DIAGNOSTICS n = ROW_COUNT;
  DELETE FROM chat_intentos WHERE created_at < now() - interval '1 day';
  RETURN n;
END;
$$;
REVOKE ALL ON FUNCTION public.chat_purgar() FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.chat_admin_purgar()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Solo admin'; END IF;
  RETURN chat_purgar();
END;
$$;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
-- todos los días 04:00 de Argentina (07:00 UTC)
SELECT cron.schedule('chat-purgar', '0 7 * * *', $cron$select public.chat_purgar()$cron$);

-- ---------- Permisos de las funciones nuevas ----------
DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'chat_crear_sala(text,text)', 'chat_admin_crear_privada(text,text,text)',
    'chat_entrar_con_clave(text)', 'chat_salir(uuid)', 'chat_eliminar_sala(uuid)',
    'chat_resumen()', 'chat_admin_salas()', 'chat_admin_miembros(uuid)',
    'chat_admin_expulsar(uuid,uuid)', 'chat_admin_regenerar_clave(uuid,text)',
    'chat_admin_sala_set(uuid,text,text,integer)', 'chat_admin_config_set(integer)',
    'chat_admin_silenciar(uuid,boolean)', 'chat_admin_purgar()'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM public, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', f);
  END LOOP;
END $$;

-- ---------- Realtime ----------
ALTER PUBLICATION supabase_realtime ADD TABLE chat_reacciones;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_salas;
