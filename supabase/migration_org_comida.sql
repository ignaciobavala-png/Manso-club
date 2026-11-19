-- /org/comida: formulario de comida y bebida para toda la organización de BLUR.
--
-- La página es pública a propósito (el link se manda por WhatsApp a toda la org,
-- sin pedirles la clave de /org), pero la tabla no: RLS prendida y sin ninguna
-- policy. Escribe y lee SOLO el servidor (service role, /api/org/comida): el
-- POST es abierto con validación y tope de largo, la lectura y el borrado piden
-- la cookie de /org.

CREATE TABLE IF NOT EXISTS org_comida (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  nombre text NOT NULL,
  area text NOT NULL,
  -- Qué comidas necesita ese día (desayuno, almuerzo, merienda, cena, madrugada).
  comidas text[] NOT NULL DEFAULT '{}',
  dieta text[] NOT NULL DEFAULT '{}',
  alergias text,
  bebida text[] NOT NULL DEFAULT '{}',
  extras text
);

CREATE INDEX IF NOT EXISTS org_comida_created_idx ON org_comida (created_at DESC);

ALTER TABLE org_comida ENABLE ROW LEVEL SECURITY;
