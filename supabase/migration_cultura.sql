-- Sección Cultura: el contenido de /mansocultural.
--
-- Reemplaza a migration_membresia_cultural.sql, que colgaba estas tablas de una
-- membresía. Ana pidió que Cultura sea una sección propia del panel con su
-- página fija, así que el contenido ya no depende de que exista el plan
-- "Cultural Manso": la card, cuando exista, solo va a linkear acá.
--
-- Las tablas viejas se dropean porque nunca llegaron a tener una fila.

DROP TABLE IF EXISTS membresia_cultural_banners;
DROP TABLE IF EXISTS membresia_cultural_bloques;

-- Encabezado de la página. Una sola fila; `id` fijo en 1 para que no se pueda
-- crear una segunda por accidente desde el panel.
CREATE TABLE IF NOT EXISTS cultura_config (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  titulo TEXT NOT NULL DEFAULT 'Cultural Manso',
  intro TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bandas horizontales a sangre: foto de fondo con el texto encima.
CREATE TABLE IF NOT EXISTS cultura_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imagen_url TEXT NOT NULL,
  titulo TEXT,
  subtitulo TEXT,
  orden INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Frases centradas con fotos desparramadas a los costados. Una foto por lado
-- como mucho; el desparramo —tamaños y alturas— lo pone el front según la
-- posición del bloque, así Ana carga foto y texto y nada más.
CREATE TABLE IF NOT EXISTS cultura_bloques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  texto TEXT NOT NULL,
  foto_izquierda_url TEXT,
  foto_derecha_url TEXT,
  orden INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cultura_banners_orden_idx ON cultura_banners (orden);
CREATE INDEX IF NOT EXISTS cultura_bloques_orden_idx ON cultura_bloques (orden);

ALTER TABLE cultura_config  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultura_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultura_bloques ENABLE ROW LEVEL SECURITY;

-- Mismo criterio que membresias_gallery: leer es público, escribir es admin.
DROP POLICY IF EXISTS cultura_config_public_read ON cultura_config;
CREATE POLICY cultura_config_public_read
  ON cultura_config FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS cultura_config_admin_write ON cultura_config;
CREATE POLICY cultura_config_admin_write
  ON cultura_config FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS cultura_banners_public_read ON cultura_banners;
CREATE POLICY cultura_banners_public_read
  ON cultura_banners FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS cultura_banners_admin_write ON cultura_banners;
CREATE POLICY cultura_banners_admin_write
  ON cultura_banners FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS cultura_bloques_public_read ON cultura_bloques;
CREATE POLICY cultura_bloques_public_read
  ON cultura_bloques FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS cultura_bloques_admin_write ON cultura_bloques;
CREATE POLICY cultura_bloques_admin_write
  ON cultura_bloques FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

INSERT INTO cultura_config (id, titulo) VALUES (1, 'Cultural Manso')
ON CONFLICT (id) DO NOTHING;
