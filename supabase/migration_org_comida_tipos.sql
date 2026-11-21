-- /org/comida ahora tiene tres formularios con la misma lógica: artistas (el
-- original), panel de charlas y staff. Cada uno con su link y su código.
-- Las filas que ya había son todas de artistas (default). `tipo` separa los
-- circuitos: el panel filtra por él y un mismo nombre puede estar en dos.
ALTER TABLE org_comida
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'artistas';
ALTER TABLE org_comida DROP CONSTRAINT IF EXISTS org_comida_tipo_check;
ALTER TABLE org_comida
  ADD CONSTRAINT org_comida_tipo_check CHECK (tipo IN ('artistas', 'charlas', 'staff'));
CREATE INDEX IF NOT EXISTS org_comida_tipo_idx ON org_comida (tipo);
