-- ============================================================
-- Manso Club — Cotizador: config editable + solicitudes
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ── 1. TIPOS DE EVENTO ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS cotizador_tipos_evento (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  label      text NOT NULL,
  icono      text NOT NULL DEFAULT 'Music',   -- nombre del ícono Lucide
  precio     integer NOT NULL DEFAULT 0,
  orden      integer NOT NULL DEFAULT 0,
  activo     boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ── 2. DURACIONES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cotizador_duraciones (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  label         text NOT NULL,
  multiplicador numeric(4,2) NOT NULL DEFAULT 1,
  orden         integer NOT NULL DEFAULT 0,
  activo        boolean NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- ── 3. CAPACIDADES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cotizador_capacidades (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  label         text NOT NULL,
  multiplicador numeric(4,2) NOT NULL DEFAULT 1,
  orden         integer NOT NULL DEFAULT 0,
  activo        boolean NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- ── 4. SERVICIOS ADICIONALES ────────────────────────────────
CREATE TABLE IF NOT EXISTS cotizador_servicios (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  label      text NOT NULL,
  precio     integer NOT NULL DEFAULT 0,
  orden      integer NOT NULL DEFAULT 0,
  activo     boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ── 5. COTIZACIONES (solicitudes recibidas) ─────────────────
CREATE TABLE IF NOT EXISTS cotizaciones (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre           text NOT NULL,
  email            text NOT NULL,
  telefono         text NOT NULL,
  tipo_evento_id   uuid REFERENCES cotizador_tipos_evento(id) ON DELETE SET NULL,
  tipo_evento_label text,                  -- snapshot del label al momento de envío
  duracion_id      uuid REFERENCES cotizador_duraciones(id) ON DELETE SET NULL,
  duracion_label   text,
  capacidad_id     uuid REFERENCES cotizador_capacidades(id) ON DELETE SET NULL,
  capacidad_label  text,
  servicios_ids    uuid[] DEFAULT '{}',    -- array de IDs seleccionados
  servicios_labels text[] DEFAULT '{}',   -- snapshot de labels
  fecha            date,
  hora             time,
  precio_estimado  integer NOT NULL DEFAULT 0,
  estado           text NOT NULL DEFAULT 'nueva' CHECK (estado IN ('nueva', 'en_proceso', 'respondida', 'archivada')),
  notas_admin      text,
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_estado ON cotizaciones (estado);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_created ON cotizaciones (created_at DESC);

-- ── 6. RLS ──────────────────────────────────────────────────
ALTER TABLE cotizador_tipos_evento  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizador_duraciones    ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizador_capacidades   ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizador_servicios     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones            ENABLE ROW LEVEL SECURITY;

-- Config: lectura pública, escritura solo admin
DROP POLICY IF EXISTS "Lectura pública cotizador tipos"      ON cotizador_tipos_evento;
DROP POLICY IF EXISTS "Lectura pública cotizador duraciones" ON cotizador_duraciones;
DROP POLICY IF EXISTS "Lectura pública cotizador capacidades" ON cotizador_capacidades;
DROP POLICY IF EXISTS "Lectura pública cotizador servicios"  ON cotizador_servicios;

CREATE POLICY "Lectura pública cotizador tipos"       ON cotizador_tipos_evento  FOR SELECT USING (true);
CREATE POLICY "Lectura pública cotizador duraciones"  ON cotizador_duraciones    FOR SELECT USING (true);
CREATE POLICY "Lectura pública cotizador capacidades" ON cotizador_capacidades   FOR SELECT USING (true);
CREATE POLICY "Lectura pública cotizador servicios"   ON cotizador_servicios     FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full cotizador tipos"       ON cotizador_tipos_evento;
DROP POLICY IF EXISTS "Admin full cotizador duraciones"  ON cotizador_duraciones;
DROP POLICY IF EXISTS "Admin full cotizador capacidades" ON cotizador_capacidades;
DROP POLICY IF EXISTS "Admin full cotizador servicios"   ON cotizador_servicios;

CREATE POLICY "Admin full cotizador tipos"       ON cotizador_tipos_evento  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full cotizador duraciones"  ON cotizador_duraciones    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full cotizador capacidades" ON cotizador_capacidades   FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full cotizador servicios"   ON cotizador_servicios     FOR ALL USING (auth.role() = 'authenticated');

-- Cotizaciones: INSERT público (cualquiera puede cotizar), SELECT/UPDATE solo admin
DROP POLICY IF EXISTS "Insert público cotizaciones" ON cotizaciones;
DROP POLICY IF EXISTS "Admin full cotizaciones"     ON cotizaciones;

CREATE POLICY "Insert público cotizaciones" ON cotizaciones FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin full cotizaciones"     ON cotizaciones FOR ALL  USING (auth.role() = 'authenticated');

-- ── 7. DATOS INICIALES (equivalentes al hardcoded actual) ───
INSERT INTO cotizador_tipos_evento (label, icono, precio, orden) VALUES
  ('Show Musical',          'Music',   50000, 1),
  ('Exposición Artística',  'Palette', 30000, 2),
  ('Taller',                'Camera',  25000, 3),
  ('Evento Privado',        'Users',   75000, 4),
  ('Sesión de Grabación',   'Mic',     40000, 5)
ON CONFLICT DO NOTHING;

INSERT INTO cotizador_duraciones (label, multiplicador, orden) VALUES
  ('2 horas',     1.0, 1),
  ('4 horas',     1.5, 2),
  ('6 horas',     2.0, 3),
  ('8 horas',     2.5, 4),
  ('Día completo',3.0, 5)
ON CONFLICT DO NOTHING;

INSERT INTO cotizador_capacidades (label, multiplicador, orden) VALUES
  ('Hasta 50 personas',    1.0, 1),
  ('Hasta 100 personas',   1.3, 2),
  ('Hasta 200 personas',   1.6, 3),
  ('Más de 200 personas',  2.0, 4)
ON CONFLICT DO NOTHING;

INSERT INTO cotizador_servicios (label, precio, orden) VALUES
  ('Servicio de bar',               15000, 1),
  ('Catering básico',               25000, 2),
  ('Equipo de sonido profesional',  20000, 3),
  ('Equipo de luces',               18000, 4),
  ('Fotógrafo',                     35000, 5),
  ('Equipo de seguridad',           12000, 6)
ON CONFLICT DO NOTHING;
