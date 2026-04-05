-- Agrega columna categoria a membresias para agrupar por tipo
ALTER TABLE membresias
  ADD COLUMN IF NOT EXISTS categoria text NOT NULL DEFAULT 'Cowork';
