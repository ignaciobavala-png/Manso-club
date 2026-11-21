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
