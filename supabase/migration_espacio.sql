-- Sección "Nuestro espacio": las salas del cowork, con una foto cada una.
--
-- La página (/nuestro-espacio) lista los nombres a la izquierda y muestra la
-- foto de la sala elegida a la derecha, como la refe que pasó Ana
-- (somoseito.io#tariff-section). El panel es solo para cargar esas fotos y,
-- si hace falta, renombrar o sumar salas.

CREATE TABLE IF NOT EXISTS espacio_config (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  titulo TEXT NOT NULL DEFAULT 'Nuestro espacio',
  intro TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS espacio_salas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  imagen_url TEXT,
  orden INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS espacio_salas_orden_idx ON espacio_salas (orden);

ALTER TABLE espacio_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE espacio_salas  ENABLE ROW LEVEL SECURITY;

-- Mismo criterio que cultura: leer es público, escribir es admin.
DROP POLICY IF EXISTS espacio_config_public_read ON espacio_config;
CREATE POLICY espacio_config_public_read
  ON espacio_config FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS espacio_config_admin_write ON espacio_config;
CREATE POLICY espacio_config_admin_write
  ON espacio_config FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS espacio_salas_public_read ON espacio_salas;
CREATE POLICY espacio_salas_public_read
  ON espacio_salas FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS espacio_salas_admin_write ON espacio_salas;
CREATE POLICY espacio_salas_admin_write
  ON espacio_salas FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

INSERT INTO espacio_config (id, titulo) VALUES (1, 'Nuestro espacio')
ON CONFLICT (id) DO NOTHING;

-- Las ocho salas que pasó Ana, en su orden. Van sin foto: la página muestra un
-- placeholder hasta que las cargue desde el panel.
INSERT INTO espacio_salas (nombre, orden)
SELECT * FROM (VALUES
  ('Sala principal', 0),
  ('Sala Olleros',   1),
  ('La Ochava',      2),
  ('Sala Cuadros',   3),
  ('Estudio',        4),
  ('Terraza',        5),
  ('Antebar',        6),
  ('Cocina',         7)
) AS v(nombre, orden)
WHERE NOT EXISTS (SELECT 1 FROM espacio_salas);
