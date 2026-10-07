-- Festival: video de YouTube por artista y sección "Spots".
--
-- `youtube_url` guarda el link como lo pegue Ana (watch, youtu.be, shorts o
-- embed); la página del artista saca el id y lo muestra embebido.
ALTER TABLE festival_artistas ADD COLUMN IF NOT EXISTS youtube_url TEXT;

-- Un spot es un lugar de la fiesta (un escenario, la barra, el bosque): título,
-- descripción y fotos, en /festival/spots. No se cruza con festival_escenarios
-- a propósito: un spot puede no tener line-up y un escenario puede no tener
-- fotos. `fotos` va en el orden en que se muestran, como locacion_fotos.
CREATE TABLE IF NOT EXISTS festival_spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  fotos TEXT[] NOT NULL DEFAULT '{}',
  orden INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS festival_spots_orden_idx ON festival_spots (orden);

ALTER TABLE festival_spots ENABLE ROW LEVEL SECURITY;

-- Mismo criterio que el resto del festival: sin publicar, solo lo lee un admin.
DROP POLICY IF EXISTS festival_spots_read ON festival_spots;
CREATE POLICY festival_spots_read
  ON festival_spots FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM festival_config WHERE publicado) OR public.is_admin());
DROP POLICY IF EXISTS festival_spots_admin_write ON festival_spots;
CREATE POLICY festival_spots_admin_write
  ON festival_spots FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
