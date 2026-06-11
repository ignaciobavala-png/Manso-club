-- Ampliar constraint de tipo en streaming_contenido para incluir 'live'
-- La categoría 'live' existe en streaming_categorias pero faltaba en la constraint

ALTER TABLE streaming_contenido
  DROP CONSTRAINT streaming_contenido_tipo_check;

ALTER TABLE streaming_contenido
  ADD CONSTRAINT streaming_contenido_tipo_check
  CHECK (tipo = ANY (ARRAY['concierto'::text, 'curso'::text, 'taller'::text, 'live'::text]));
