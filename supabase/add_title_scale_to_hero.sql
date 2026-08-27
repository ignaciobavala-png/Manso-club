-- Tamaño del título de cada slide del hero, en porcentaje.
--
-- No se guarda un tamaño en píxeles a propósito: el título usa un clamp()
-- responsive, así que un valor fijo que se ve bien en el monitor de Ana se
-- desbordaría en un celular. Esto multiplica ese clamp, así el título sigue
-- adaptándose solo a cada pantalla pero ella elige qué tan grande va.
--
-- 100 = el tamaño de diseño. El rango se limita a 50–150 para que no se pueda
-- dejar ilegible ni romper el layout desde el panel.

ALTER TABLE hero_config
ADD COLUMN title_scale SMALLINT NOT NULL DEFAULT 100
CHECK (title_scale BETWEEN 50 AND 150);

COMMENT ON COLUMN hero_config.title_scale IS 'Tamaño del título en % sobre el clamp() responsive del diseño. 100 = tamaño base, rango 50-150.';
