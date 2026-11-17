-- /org: mapas de experiencia de BLUR para la coordinación de la organización.
--
-- Eran dos HTML sueltos (sin hosting ni base). Acá viven como datos: cada mapa
-- tiene fases, cada fase espacios (las columnas de la matriz) y cada espacio
-- ítems por nivel (las filas: staff, señalética, touchpoints...).
--
-- Lo lee y escribe SOLO el servidor (/api/org/*, con service role) después de
-- validar la clave: las tablas tienen RLS prendida y ninguna policy, así que ni
-- el navegador ni la anon key pueden tocarlas.

CREATE TABLE IF NOT EXISTS org_mapas (
  id text PRIMARY KEY,
  titulo text NOT NULL,
  orden int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS org_fases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mapa_id text NOT NULL REFERENCES org_mapas(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  orden int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS org_espacios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fase_id uuid NOT NULL REFERENCES org_fases(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  -- Medidas del plano ("pista de 20 × 30 m") y distancias a otros espacios.
  plano text,
  cerca text,
  orden int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS org_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  espacio_id uuid NOT NULL REFERENCES org_espacios(id) ON DELETE CASCADE,
  nivel text NOT NULL CHECK (nivel IN ('staff','sen','tou','nec','her','des','dol','emo')),
  texto text NOT NULL,
  -- Riesgo detectado por las medidas del plano (el "⚠" del HTML original).
  riesgo boolean NOT NULL DEFAULT false,
  -- Para tildarlo como resuelto/cubierto desde la coordinación.
  hecho boolean NOT NULL DEFAULT false,
  orden int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS org_fases_mapa_idx ON org_fases (mapa_id, orden);
CREATE INDEX IF NOT EXISTS org_espacios_fase_idx ON org_espacios (fase_id, orden);
CREATE INDEX IF NOT EXISTS org_items_espacio_idx ON org_items (espacio_id, nivel, orden);

-- Intentos fallidos de clave, para frenar la fuerza bruta (la clave es corta).
-- Solo se guarda un hash de la IP, que cambia cada día.
CREATE TABLE IF NOT EXISTS org_intentos (
  id bigserial PRIMARY KEY,
  ip_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS org_intentos_idx ON org_intentos (ip_hash, created_at);

ALTER TABLE org_mapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_fases ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_espacios ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_intentos ENABLE ROW LEVEL SECURITY;
