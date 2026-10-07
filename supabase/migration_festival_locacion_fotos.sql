-- Festival: Locación pasa de una foto a una galería (como la de Basilar).
--
-- `locacion_fotos` guarda las URLs en el orden en que se muestran; el panel
-- las sube, reordena y quita. La foto única que había en `foto_url` queda como
-- primera de la galería. `foto_url` no se borra para no romper un deploy viejo,
-- pero ya no la lee nadie.
ALTER TABLE festival_config
  ADD COLUMN IF NOT EXISTS locacion_fotos TEXT[] NOT NULL DEFAULT '{}';

UPDATE festival_config
SET locacion_fotos = ARRAY[foto_url]
WHERE id = 1 AND foto_url IS NOT NULL AND cardinality(locacion_fotos) = 0;
