-- Hospitality de artistas dentro de /org/comida: escenario, horario, cuándo comen
-- y qué quieren en cabina. Todo nullable: solo lo llenan los artistas.
ALTER TABLE org_comida
  ADD COLUMN IF NOT EXISTS escenario text,
  ADD COLUMN IF NOT EXISTS horario text,
  ADD COLUMN IF NOT EXISTS comer text,
  ADD COLUMN IF NOT EXISTS bebida_set text;
