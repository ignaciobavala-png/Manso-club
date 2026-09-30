-- Festival: las dos imágenes de la página pasan a cargarse desde el panel.
--
-- `banner_url` es el fondo del hero (reemplaza la geometría sagrada animada).
-- `foto_url` es la foto a sangre entre el line-up y las entradas; sin foto,
-- esa franja no se dibuja.
ALTER TABLE festival_config ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE festival_config ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- La foto del bosque de Unsplash (Lukasz Szmigiel, licencia libre) que estaba
-- fija en el código queda como valor inicial, para que la página no cambie
-- hasta que Ana suba la propia.
UPDATE festival_config
SET foto_url = 'https://images.unsplash.com/photo-1426170042593-200f250dfdaf?w=2400&q=80&auto=format'
WHERE id = 1 AND foto_url IS NULL;
