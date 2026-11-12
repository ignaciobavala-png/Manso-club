-- Chat del festival (/blurfestival): el asistente público que contesta dudas
-- (cómo llegar, horarios, entradas) con la información que ya es pública.
--
-- El modelo NO lee la base: el servidor le arma una ficha con lo público y
-- nada más (ver `lib/festival-bot.ts`). Acá vive solo lo que el chat necesita
-- guardar: la bitácora de preguntas y el freno de uso.
--
-- Mismo criterio que el conteo de visitas: escribe solo el servidor
-- (/api/festival/bot, con service role), así que las tablas no tienen política
-- de insert y nadie puede llenarlas desde el navegador. Lee solo un admin.

-- ── Bitácora: qué pregunta la gente ───────────────────────────────────────
-- Sirve para ver qué dudas se repiten y mejorar el FAQ. Sin IP y sin cuenta:
-- `sesion` es un id al azar que vive en el navegador y solo agrupa una charla.
-- No hay pantalla que la muestre; Ana la consulta por el asistente del panel.
CREATE TABLE IF NOT EXISTS festival_bot_consultas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion uuid,
  idioma text,
  pregunta text NOT NULL,
  -- Null si el modelo falló (resultado = 'error').
  respuesta text,
  resultado text NOT NULL DEFAULT 'respondida' CHECK (resultado IN ('respondida', 'error')),
  creada timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS festival_bot_consultas_creada_idx ON festival_bot_consultas (creada DESC);

ALTER TABLE festival_bot_consultas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS festival_bot_consultas_admin_read ON festival_bot_consultas;
CREATE POLICY festival_bot_consultas_admin_read
  ON festival_bot_consultas FOR SELECT TO authenticated
  USING (public.is_admin());

-- ── Freno de uso ──────────────────────────────────────────────────────────
-- Cada mensaje le cuesta plata a Manso (DeepSeek cobra por uso) y el chat es
-- público, así que hay tope por persona y tope general. Un contador en memoria
-- no sirve en Vercel (cada instancia tendría el suyo): va en la base.
--
-- `clave` es "ip:<hash>:<ventana>" o "global:<ventana>". El hash lo arma el
-- servidor con un secreto y la fecha del día, así que acá nunca queda una IP
-- ni algo que permita seguir a alguien de un día al otro.
CREATE TABLE IF NOT EXISTS festival_bot_limite (
  clave text PRIMARY KEY,
  desde timestamptz NOT NULL DEFAULT now(),
  n integer NOT NULL DEFAULT 0
);

-- Sin políticas: solo entra el service role.
ALTER TABLE festival_bot_limite ENABLE ROW LEVEL SECURITY;

-- Cuenta un uso de `p_clave` y dice si todavía está dentro del tope. La
-- ventana arranca con el primer uso y se reinicia sola cuando vence. Contar y
-- comparar van en una sola sentencia: dos pedidos a la vez no se pisan.
CREATE OR REPLACE FUNCTION festival_bot_permitir(p_clave text, p_max integer, p_ventana_seg integer)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_n integer;
BEGIN
  INSERT INTO festival_bot_limite AS l (clave, desde, n)
  VALUES (p_clave, now(), 1)
  ON CONFLICT (clave) DO UPDATE SET
    n     = CASE WHEN l.desde < now() - make_interval(secs => p_ventana_seg) THEN 1 ELSE l.n + 1 END,
    desde = CASE WHEN l.desde < now() - make_interval(secs => p_ventana_seg) THEN now() ELSE l.desde END
  RETURNING n INTO v_n;

  -- De vez en cuando barre las claves viejas (los hashes cambian cada día).
  IF random() < 0.02 THEN
    DELETE FROM festival_bot_limite WHERE desde < now() - interval '2 days';
  END IF;

  RETURN v_n <= p_max;
END;
$$;

-- Supabase le da EXECUTE a anon y authenticated por defecto: se lo sacamos,
-- o cualquiera podría gastarle el cupo a otro llamando la función a mano.
REVOKE ALL ON FUNCTION festival_bot_permitir(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION festival_bot_permitir(text, integer, integer) TO service_role;
