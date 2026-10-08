-- Festival: el home deja de ser solo el hero y scrollea por algunas secciones
-- (fotos, visión, line-up). Las fotos son las de Locación más estas, que Ana
-- suma desde el panel si quiere mostrar algo que no sea del lugar.
ALTER TABLE festival_config
  ADD COLUMN IF NOT EXISTS home_fotos TEXT[] NOT NULL DEFAULT '{}';
