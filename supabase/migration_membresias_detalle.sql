-- Renovación visual de membresías (refe somoseito.io que trajo Ana).
-- Todo aditivo y nullable: el sitio en producción ignora estas columnas hasta
-- que se despliegue la rama `membership`.

ALTER TABLE membresias
  ADD COLUMN IF NOT EXISTS slug TEXT,
  -- La que se ve en la tarjeta (home y /membresias). `descripcion` pasa a ser
  -- el fallback histórico: si `descripcion_corta` está vacía, se usa aquella.
  ADD COLUMN IF NOT EXISTS descripcion_corta TEXT,
  -- La que se ve en la página de detalle /membresias/<slug>.
  ADD COLUMN IF NOT EXISTS descripcion_completa TEXT,
  -- Color pleno del detalle y, en la card cultural, del fondo. Guarda un token
  -- de la paleta ('terra' | 'olive' | 'blue' | 'brown'), no un hex: así el
  -- panel ofrece opciones cerradas y no se cuela un color fuera de marca.
  ADD COLUMN IF NOT EXISTS color_acento TEXT,
  -- Cultural Manso: rompe la grilla con fondo de color pleno.
  ADD COLUMN IF NOT EXISTS es_cultural BOOLEAN NOT NULL DEFAULT false;

-- Backfill del slug a partir del nombre para las filas que ya existen.
-- `translate` en vez de unaccent: la extensión no está instalada y los nombres
-- de los planes no traen más que vocales acentuadas.
UPDATE membresias
SET slug = trim(both '-' from regexp_replace(
  lower(translate(nombre, 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN')),
  '[^a-z0-9]+', '-', 'g'
))
WHERE slug IS NULL OR slug = '';

CREATE UNIQUE INDEX IF NOT EXISTS membresias_slug_key ON membresias (slug);
