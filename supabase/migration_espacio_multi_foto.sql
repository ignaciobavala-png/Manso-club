-- "Nuestro espacio": hasta cuatro fotos por sala en vez de una.
--
-- La página mantiene un solo contenedor por sala (no se suman placeholders):
-- las fotos que estén cargadas rotan adentro de ese mismo cuadro. Por eso el
-- array puede tener 1, 2, 3 o 4 elementos y la página se adapta sola.
--
-- `imagen_url` se conserva y se mantiene sincronizada con `imagenes[1]`: es la
-- foto de portada, y así nada que la lea de antes se rompe.

ALTER TABLE espacio_salas
  ADD COLUMN IF NOT EXISTS imagenes TEXT[] NOT NULL DEFAULT '{}';

-- Backfill: la foto única que ya estaba cargada pasa a ser la primera del array.
UPDATE espacio_salas
SET imagenes = ARRAY[imagen_url]
WHERE imagen_url IS NOT NULL
  AND cardinality(imagenes) = 0;

-- Tope de cuatro, que es lo que muestra el panel.
ALTER TABLE espacio_salas DROP CONSTRAINT IF EXISTS espacio_salas_imagenes_max;
ALTER TABLE espacio_salas
  ADD CONSTRAINT espacio_salas_imagenes_max CHECK (cardinality(imagenes) <= 4);
