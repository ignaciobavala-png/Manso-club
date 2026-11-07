-- Festival: transporte en lancha. Ana carga los viajes desde el panel (sección
-- "Transporte") y la app del festival los lee. Cada fila es un viaje: cuándo
-- sale de la terminal y cuándo vuelve. Los horarios son texto "HH:MM" (24 h) y
-- pueden quedar vacíos hasta último momento; si el regreso es menor que la
-- salida, es pasada la medianoche (el festival termina a las 04).

CREATE TABLE IF NOT EXISTS festival_lanchas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- "Lancha 1", "Primer viaje"… como lo quiera llamar la organización.
  nombre TEXT NOT NULL,
  salida TEXT CHECK (salida IS NULL OR salida ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  regreso TEXT CHECK (regreso IS NULL OR regreso ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  -- Aviso corto: punto de encuentro, capacidad, "último viaje"…
  nota TEXT NOT NULL DEFAULT '',
  orden INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS festival_lanchas_orden_idx ON festival_lanchas (orden);

ALTER TABLE festival_lanchas ENABLE ROW LEVEL SECURITY;

-- Mismo criterio que el resto del festival: sin publicar, solo lo lee un admin.
DROP POLICY IF EXISTS festival_lanchas_read ON festival_lanchas;
CREATE POLICY festival_lanchas_read
  ON festival_lanchas FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM festival_config WHERE publicado) OR public.is_admin());
DROP POLICY IF EXISTS festival_lanchas_admin_write ON festival_lanchas;
CREATE POLICY festival_lanchas_admin_write
  ON festival_lanchas FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
