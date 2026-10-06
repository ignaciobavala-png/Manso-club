-- Festival → Subreal: la página pasa de una sola hoja larga a un sitio chico
-- con menú, como basilarfestival.com (pedido de Ana en "web manso.docx").
--
--   /festival            hero
--   /festival/vision     texto con palabras resaltadas   → festival_config.vision
--   /festival/locacion   texto + datos + foto            → festival_config.locacion
--   /festival/line-up    line-up por escenario, cada nombre es un link
--   /festival/line-up/x  página del artista (estructura de /speakers/[slug] de la bitconf)
--   /festival/tickets    la tabla de venta de siempre
--   /festival/info       preguntas frecuentes en tres columnas → festival_faq
--
-- Mismo RLS que el resto del festival: sin publicar, solo lo lee un admin.

ALTER TABLE festival_config ADD COLUMN IF NOT EXISTS vision TEXT;
ALTER TABLE festival_config ADD COLUMN IF NOT EXISTS locacion TEXT;
-- Segundo color: el de las palabras resaltadas (en Basilar, verde y celeste).
ALTER TABLE festival_config ADD COLUMN IF NOT EXISTS color_resalte TEXT NOT NULL DEFAULT '#B9B23E';
ALTER TABLE festival_config ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE festival_config ADD COLUMN IF NOT EXISTS email TEXT;

-- Paleta de la fusión Basilar + Manso: manso-brown llevado a casi negro,
-- manso-cream y manso-terra encendida para que se lea sobre oscuro.
ALTER TABLE festival_config ALTER COLUMN color_fondo SET DEFAULT '#1C1410';
ALTER TABLE festival_config ALTER COLUMN color_texto SET DEFAULT '#FFFCDC';
ALTER TABLE festival_config ALTER COLUMN color_acento SET DEFAULT '#E2532B';

-- Solo si siguen los colores de antes: si Ana ya eligió otros, no se pisan.
UPDATE festival_config
SET color_fondo = '#1C1410', color_texto = '#FFFCDC', color_acento = '#E2532B'
WHERE id = 1 AND color_fondo = '#12130E' AND color_texto = '#F1E9D6' AND color_acento = '#FF5A1F';

UPDATE festival_config SET nombre = 'Subreal' WHERE id = 1 AND nombre = 'Manso Festival';

-- Un artista del line-up, con página propia. Reemplaza a
-- `festival_escenarios.artistas` (que era una lista de nombres sin datos).
--
-- `b2b`: toca B2B con el artista de arriba en el mismo escenario. Así cada uno
-- tiene su página y en el line-up se leen juntos, sin escribir "X B2B Y".
CREATE TABLE IF NOT EXISTS festival_artistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  escenario_id UUID REFERENCES festival_escenarios (id) ON DELETE SET NULL,
  b2b BOOLEAN NOT NULL DEFAULT false,
  -- "AR", "DE"… va chiquito al lado del nombre en el line-up.
  pais TEXT,
  -- Línea debajo del nombre en su página: "Berlín — Techno / Dub".
  origen TEXT,
  foto_url TEXT,
  bio TEXT,
  -- Texto libre: el horario puede no estar definido hasta último momento.
  dia TEXT,
  horario TEXT,
  instagram TEXT,
  soundcloud TEXT,
  resident_advisor TEXT,
  orden INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS festival_artistas_orden_idx ON festival_artistas (escenario_id, orden);

-- Una pregunta de "Info & FAQ".
CREATE TABLE IF NOT EXISTS festival_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  texto TEXT NOT NULL DEFAULT '',
  orden INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS festival_faq_orden_idx ON festival_faq (orden);

ALTER TABLE festival_artistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE festival_faq      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS festival_artistas_read ON festival_artistas;
CREATE POLICY festival_artistas_read
  ON festival_artistas FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM festival_config WHERE publicado) OR public.is_admin());
DROP POLICY IF EXISTS festival_artistas_admin_write ON festival_artistas;
CREATE POLICY festival_artistas_admin_write
  ON festival_artistas FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS festival_faq_read ON festival_faq;
CREATE POLICY festival_faq_read
  ON festival_faq FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM festival_config WHERE publicado) OR public.is_admin());
DROP POLICY IF EXISTS festival_faq_admin_write ON festival_faq;
CREATE POLICY festival_faq_admin_write
  ON festival_faq FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Pasar los artistas que ya estaban cargados como texto. "X B2B Y" se parte en
-- dos filas y la segunda queda marcada como B2B con la anterior.
INSERT INTO festival_artistas (slug, nombre, escenario_id, b2b, orden)
SELECT
  trim(both '-' from regexp_replace(lower(parte.nombre), '[^a-z0-9]+', '-', 'g')),
  parte.nombre,
  e.id,
  parte.k > 1,
  row_number() OVER (PARTITION BY e.id ORDER BY linea.n, parte.k) - 1
FROM festival_escenarios e
CROSS JOIN LATERAL unnest(e.artistas) WITH ORDINALITY AS linea (texto, n)
CROSS JOIN LATERAL (
  SELECT trim(p) AS nombre, k
  FROM regexp_split_to_table(linea.texto, '\s+b2b\s+', 'i') WITH ORDINALITY AS x (p, k)
) AS parte
WHERE parte.nombre <> ''
  AND NOT EXISTS (SELECT 1 FROM festival_artistas)
ON CONFLICT (slug) DO NOTHING;

-- `festival_escenarios.artistas` no se borra en esta migración para que la
-- página vieja siga andando hasta que salga el deploy nuevo, pero ya nada la
-- lee ni la escribe: la verdad es `festival_artistas`.
COMMENT ON COLUMN festival_escenarios.artistas IS
  'Obsoleta desde migration_festival_subreal.sql: usar festival_artistas.';
