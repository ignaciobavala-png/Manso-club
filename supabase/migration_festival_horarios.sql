-- Horarios del line-up de BLUR (grilla que mandó la producción, 21/11/2026).
-- Formato único "HH:MM a HH:MM": es el que muestra el bloque SET de
-- /blurfestival/line-up/[slug]. Se identifica por slug; idempotente.
UPDATE festival_artistas a SET horario = v.h
FROM (VALUES
  -- El Edén
  ('mestizo', '16:00 a 17:30'),
  ('kndr', '17:30 a 19:30'),
  ('ana-hagen', '19:30 a 21:30'),
  ('portiwav', '21:30 a 23:30'),
  ('grant-dell', '23:30 a 02:00'),
  ('malena', '02:00 a 04:00'),
  -- Chill Microdancing
  ('qoa', '15:00 a 16:00'),
  ('tom-terzi-live', '16:00 a 17:00'),
  ('mijkalova', '18:00 a 20:00'),
  ('matiasmauger', '20:00 a 22:00'),
  ('sego', '20:00 a 22:00'),
  ('samnaidu', '22:00 a 23:00'),
  ('ludmila', '23:00 a 01:00'),
  -- Sound & Vision
  ('orquesta', '14:30 a 15:10'),
  ('mariano-moreira-massimo-pasquini', '15:30 a 16:30'),
  ('pipol', '16:45 a 18:00'),
  ('acido-facil', '18:10 a 19:30')
) AS v(s, h)
WHERE a.slug = v.s;

-- Orden, B2B y nombres según la grilla (misma fecha). El line-up ordena por
-- `orden` dentro de cada escenario; `b2b = true` pega la fila con la de arriba.
UPDATE festival_artistas a SET orden = v.o, b2b = v.b, nombre = COALESCE(v.n, a.nombre)
FROM (VALUES
  ('mestizo', 0, false, NULL), ('kndr', 1, false, NULL), ('ana-hagen', 2, false, NULL),
  ('portiwav', 3, false, NULL), ('grant-dell', 4, false, NULL), ('malena', 5, false, NULL),
  ('qoa', 0, false, NULL), ('tom-terzi-live', 1, false, 'TOM TERZI (HYBRID)'),
  ('mijkalova', 2, false, NULL), ('matiasmauger', 3, false, NULL), ('sego', 4, true, NULL),
  ('samnaidu', 5, false, NULL), ('ludmila', 6, false, NULL),
  ('orquesta', 0, false, 'ORQUESTA TBA'), ('mariano-moreira-massimo-pasquini', 1, false, NULL),
  ('pipol', 2, false, NULL), ('acido-facil', 3, false, NULL)
) AS v(s, o, b, n)
WHERE a.slug = v.s;
