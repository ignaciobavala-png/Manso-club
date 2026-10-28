-- Festival: versión en inglés de los textos que se cargan en el panel.
--
-- /blur se ve en castellano o en inglés (selector ES/EN). La interfaz se
-- traduce en el código; esto es para lo que escribe Ana. Cada columna `*_en` es
-- opcional: vacía o en null, el sitio muestra el texto en castellano.
--
-- Quedan afuera los tipos de entrada: con Manso Gestión conectado salen de allá.
ALTER TABLE festival_config
  ADD COLUMN IF NOT EXISTS bajada_en TEXT,
  ADD COLUMN IF NOT EXISTS aviso_en TEXT,
  ADD COLUMN IF NOT EXISTS lema_en TEXT,
  ADD COLUMN IF NOT EXISTS vision_en TEXT;

ALTER TABLE festival_faq
  ADD COLUMN IF NOT EXISTS titulo_en TEXT,
  ADD COLUMN IF NOT EXISTS texto_en TEXT;

ALTER TABLE festival_spots
  ADD COLUMN IF NOT EXISTS titulo_en TEXT,
  ADD COLUMN IF NOT EXISTS descripcion_en TEXT;

ALTER TABLE festival_artistas
  ADD COLUMN IF NOT EXISTS origen_en TEXT,
  ADD COLUMN IF NOT EXISTS bio_en TEXT,
  ADD COLUMN IF NOT EXISTS dia_en TEXT;
