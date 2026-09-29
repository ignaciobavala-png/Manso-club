-- Festival: una página de venta de entradas que nace de Manso pero con
-- identidad propia (/festival). Referencia de Ana: la página de Passline del
-- Rave 3000 — flyer, line-up por escenario y una tabla de tipos de entrada
-- donde cada fila tiene precio y estado (en venta / agotado / finalizado).
--
-- Mientras `publicado` sea false la página da 404 a todo el mundo menos a los
-- admins, y el RLS acompaña: un anónimo con la anon key no puede leer ni el
-- line-up ni los precios antes del anuncio.
--
-- La compra todavía no está conectada: el botón de la página no cobra.

CREATE TABLE IF NOT EXISTS festival_config (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  nombre TEXT NOT NULL DEFAULT 'Festival',
  bajada TEXT,
  fecha DATE,
  horario TEXT,
  lugar TEXT,
  direccion TEXT,
  flyer_url TEXT,
  aviso TEXT DEFAULT 'Evento solo para mayores de 18 años.',
  lema TEXT,
  -- Identidad propia: la página no usa la paleta de Manso. Por defecto, la de
  -- las láminas de Ana: oscuro verdoso, crema y un naranja que abre el degradé.
  color_fondo TEXT NOT NULL DEFAULT '#12130E',
  color_texto TEXT NOT NULL DEFAULT '#F1E9D6',
  color_acento TEXT NOT NULL DEFAULT '#FF5A1F',
  publicado BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Un escenario con su line-up. Los artistas van como lista simple (uno por
-- línea en el panel): no hace falta que sean filas propias para mostrarlos.
CREATE TABLE IF NOT EXISTS festival_escenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  artistas TEXT[] NOT NULL DEFAULT '{}',
  orden INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Un tipo de entrada = una fila de la tabla de venta.
-- `entradas_por_unidad` es para los packs: "Pack x5" es 1 unidad que vale 5
-- entradas. `precio` es el de la unidad (el pack entero), siempre en pesos.
CREATE TABLE IF NOT EXISTS festival_entradas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (precio >= 0),
  entradas_por_unidad INT NOT NULL DEFAULT 1 CHECK (entradas_por_unidad >= 1),
  max_por_compra INT NOT NULL DEFAULT 10 CHECK (max_por_compra >= 1),
  estado TEXT NOT NULL DEFAULT 'en_venta'
    CHECK (estado IN ('en_venta', 'agotado', 'finalizado', 'proximamente')),
  orden INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS festival_escenarios_orden_idx ON festival_escenarios (orden);
CREATE INDEX IF NOT EXISTS festival_entradas_orden_idx ON festival_entradas (orden);

ALTER TABLE festival_config     ENABLE ROW LEVEL SECURITY;
ALTER TABLE festival_escenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE festival_entradas   ENABLE ROW LEVEL SECURITY;

-- Leer: público solo si el festival está publicado; el admin siempre.
DROP POLICY IF EXISTS festival_config_read ON festival_config;
CREATE POLICY festival_config_read
  ON festival_config FOR SELECT TO public
  USING (publicado OR public.is_admin());
DROP POLICY IF EXISTS festival_config_admin_write ON festival_config;
CREATE POLICY festival_config_admin_write
  ON festival_config FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- El subquery corre con el RLS de festival_config, así que para un anónimo
-- solo da true si la fila está publicada.
DROP POLICY IF EXISTS festival_escenarios_read ON festival_escenarios;
CREATE POLICY festival_escenarios_read
  ON festival_escenarios FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM festival_config WHERE publicado) OR public.is_admin());
DROP POLICY IF EXISTS festival_escenarios_admin_write ON festival_escenarios;
CREATE POLICY festival_escenarios_admin_write
  ON festival_escenarios FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS festival_entradas_read ON festival_entradas;
CREATE POLICY festival_entradas_read
  ON festival_entradas FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM festival_config WHERE publicado) OR public.is_admin());
DROP POLICY IF EXISTS festival_entradas_admin_write ON festival_entradas;
CREATE POLICY festival_entradas_admin_write
  ON festival_entradas FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO festival_config (id, nombre) VALUES (1, 'Manso Festival')
ON CONFLICT (id) DO NOTHING;

-- Tipos de entrada de ejemplo, calcados de la refe, para que la tabla no
-- arranque vacía. Precios en cero: los define Ana.
INSERT INTO festival_entradas (nombre, entradas_por_unidad, estado, orden)
SELECT * FROM (VALUES
  ('Early Bird',                1, 'proximamente', 0),
  ('Entrada general - Etapa 1', 1, 'proximamente', 1),
  ('Pack x3',                   3, 'proximamente', 2),
  ('Pack x5',                   5, 'proximamente', 3)
) AS v(nombre, entradas_por_unidad, estado, orden)
WHERE NOT EXISTS (SELECT 1 FROM festival_entradas);
