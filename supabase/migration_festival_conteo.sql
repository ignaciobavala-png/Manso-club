-- Conteo de visitas de /blur: cuántas veces se ve cada pantalla, cuánto se
-- queda la gente y en qué hace click. Sin cookies de terceros, sin IP y sin
-- datos personales: el visitante es un id al azar que vive en el navegador.
--
-- Escribe solo el servidor (/api/festival/visitas, con service role), así que
-- las tablas no tienen política de insert: nadie puede inventar números desde
-- el navegador. Lee solo un admin.

-- ── Parámetros (una sola fila, se editan desde el panel) ──────────────────
CREATE TABLE IF NOT EXISTS festival_conteo_config (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  -- Interruptor general. Apagado, el navegador ni siquiera carga el medidor.
  activo boolean NOT NULL DEFAULT true,
  contar_clicks boolean NOT NULL DEFAULT true,
  contar_tiempo boolean NOT NULL DEFAULT true,
  -- El tiempo corre solo con la pestaña a la vista.
  solo_pestana_visible boolean NOT NULL DEFAULT true,
  -- Segundos sin mover el mouse / tocar / scrollear tras los cuales deja de
  -- contar (alguien que dejó la pestaña abierta y se fue). 0 = no cortar.
  inactividad_seg integer NOT NULL DEFAULT 60 CHECK (inactividad_seg BETWEEN 0 AND 3600),
  -- Tope de tiempo por vista: ningún registro cuenta más que esto.
  tiempo_max_seg integer NOT NULL DEFAULT 1800 CHECK (tiempo_max_seg BETWEEN 10 AND 86400),
  -- Cada cuánto manda el navegador lo que lleva mientras la pantalla sigue abierta.
  heartbeat_seg integer NOT NULL DEFAULT 20 CHECK (heartbeat_seg BETWEEN 5 AND 300),
  -- Clicks que se guardan con detalle por vista (el total sigue contando).
  clicks_max_por_vista integer NOT NULL DEFAULT 50 CHECK (clicks_max_por_vista BETWEEN 0 AND 500),
  -- No contar a quien está logueado como admin (Ana navegando su propio sitio).
  excluir_admin boolean NOT NULL DEFAULT true,
  -- Prefijos de ruta que no se miden, ej. {/blur/compra}.
  rutas_excluidas text[] NOT NULL DEFAULT '{}',
  -- Días que se guardan los datos. 0 = para siempre.
  retencion_dias integer NOT NULL DEFAULT 365 CHECK (retencion_dias >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO festival_conteo_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE festival_conteo_config ENABLE ROW LEVEL SECURITY;

-- El layout de /blur la lee con el cliente con cookies, igual que festival_config.
DROP POLICY IF EXISTS festival_conteo_config_read ON festival_conteo_config;
CREATE POLICY festival_conteo_config_read
  ON festival_conteo_config FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM festival_config WHERE publicado) OR public.is_admin());
DROP POLICY IF EXISTS festival_conteo_config_admin_write ON festival_conteo_config;
CREATE POLICY festival_conteo_config_admin_write
  ON festival_conteo_config FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── Una fila por pantalla vista ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS festival_visitas (
  -- Lo genera el navegador: manda el mismo id varias veces (cada heartbeat) y
  -- el servidor actualiza la misma fila.
  id uuid PRIMARY KEY,
  visitante uuid NOT NULL,
  sesion uuid NOT NULL,
  -- Ruta sin query; los ids (órdenes) se reemplazan por ":id".
  path text NOT NULL,
  dispositivo text NOT NULL DEFAULT 'escritorio' CHECK (dispositivo IN ('movil', 'tablet', 'escritorio')),
  idioma text,
  -- Solo el dominio de origen, y solo en la primera pantalla de la sesión.
  origen text,
  segundos integer,
  clicks integer NOT NULL DEFAULT 0,
  creada timestamptz NOT NULL DEFAULT now(),
  actualizada timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS festival_visitas_creada_idx ON festival_visitas (creada DESC);
CREATE INDEX IF NOT EXISTS festival_visitas_path_idx ON festival_visitas (path, creada DESC);

-- ── Detalle de clicks ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS festival_clicks (
  visita_id uuid NOT NULL REFERENCES festival_visitas(id) ON DELETE CASCADE,
  -- Número de orden dentro de la vista: con (visita_id, n) como clave, un
  -- reintento del navegador no duplica el click.
  n integer NOT NULL,
  path text NOT NULL,
  elemento text NOT NULL,
  creado timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (visita_id, n)
);

CREATE INDEX IF NOT EXISTS festival_clicks_path_idx ON festival_clicks (path, elemento);

ALTER TABLE festival_visitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE festival_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS festival_visitas_admin ON festival_visitas;
CREATE POLICY festival_visitas_admin
  ON festival_visitas FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS festival_clicks_admin ON festival_clicks;
CREATE POLICY festival_clicks_admin
  ON festival_clicks FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── Lecturas agregadas para el panel ──────────────────────────────────────
-- LANGUAGE sql + `public.is_admin()` en el WHERE: a quien no es admin le
-- devuelven vacío en vez de datos. `p_dispositivo` null = todos.

CREATE OR REPLACE FUNCTION festival_conteo_resumen(
  p_desde timestamptz, p_hasta timestamptz, p_dispositivo text DEFAULT NULL
)
RETURNS TABLE (vistas bigint, visitantes bigint, sesiones bigint, segundos_prom numeric, clicks bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::bigint,
         count(DISTINCT v.visitante)::bigint,
         count(DISTINCT v.sesion)::bigint,
         round(avg(v.segundos), 1),
         coalesce(sum(v.clicks), 0)::bigint
  FROM festival_visitas v
  WHERE public.is_admin()
    AND v.creada >= p_desde AND v.creada < p_hasta
    AND (p_dispositivo IS NULL OR v.dispositivo = p_dispositivo);
$$;

CREATE OR REPLACE FUNCTION festival_conteo_pantallas(
  p_desde timestamptz, p_hasta timestamptz, p_dispositivo text DEFAULT NULL
)
RETURNS TABLE (
  path text, vistas bigint, visitantes bigint,
  segundos_prom numeric, segundos_mediana numeric, segundos_total bigint, clicks bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT v.path,
         count(*)::bigint,
         count(DISTINCT v.visitante)::bigint,
         round(avg(v.segundos), 1),
         round((percentile_cont(0.5) WITHIN GROUP (ORDER BY v.segundos))::numeric, 1),
         coalesce(sum(v.segundos), 0)::bigint,
         coalesce(sum(v.clicks), 0)::bigint
  FROM festival_visitas v
  WHERE public.is_admin()
    AND v.creada >= p_desde AND v.creada < p_hasta
    AND (p_dispositivo IS NULL OR v.dispositivo = p_dispositivo)
  GROUP BY v.path
  ORDER BY 2 DESC;
$$;

CREATE OR REPLACE FUNCTION festival_conteo_clicks(
  p_desde timestamptz, p_hasta timestamptz,
  p_dispositivo text DEFAULT NULL, p_path text DEFAULT NULL
)
RETURNS TABLE (path text, elemento text, clicks bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.path, c.elemento, count(*)::bigint
  FROM festival_clicks c
  JOIN festival_visitas v ON v.id = c.visita_id
  WHERE public.is_admin()
    AND v.creada >= p_desde AND v.creada < p_hasta
    AND (p_dispositivo IS NULL OR v.dispositivo = p_dispositivo)
    AND (p_path IS NULL OR c.path = p_path)
  GROUP BY c.path, c.elemento
  ORDER BY 3 DESC
  LIMIT 100;
$$;

-- Día en hora argentina, no UTC: una visita de las 22 hs no cae en "mañana".
CREATE OR REPLACE FUNCTION festival_conteo_dias(
  p_desde timestamptz, p_hasta timestamptz, p_dispositivo text DEFAULT NULL
)
RETURNS TABLE (dia date, vistas bigint, visitantes bigint, clicks bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (v.creada AT TIME ZONE 'America/Argentina/Buenos_Aires')::date,
         count(*)::bigint,
         count(DISTINCT v.visitante)::bigint,
         coalesce(sum(v.clicks), 0)::bigint
  FROM festival_visitas v
  WHERE public.is_admin()
    AND v.creada >= p_desde AND v.creada < p_hasta
    AND (p_dispositivo IS NULL OR v.dispositivo = p_dispositivo)
  GROUP BY 1
  ORDER BY 1;
$$;

-- ── Limpieza según `retencion_dias` (la llama el cron de conciliar) ───────
CREATE OR REPLACE FUNCTION festival_conteo_purgar()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  dias integer;
  borradas integer;
BEGIN
  SELECT retencion_dias INTO dias FROM festival_conteo_config WHERE id = 1;
  IF dias IS NULL OR dias = 0 THEN RETURN 0; END IF;
  DELETE FROM festival_visitas WHERE creada < now() - make_interval(days => dias);
  GET DIAGNOSTICS borradas = ROW_COUNT;
  RETURN borradas;
END;
$$;

REVOKE ALL ON FUNCTION festival_conteo_purgar() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION festival_conteo_purgar() TO service_role;
