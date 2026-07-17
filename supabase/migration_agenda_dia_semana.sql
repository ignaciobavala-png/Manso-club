-- Día de cursada de los talleres/actividades de agenda (0 = lunes ... 6 = domingo).
-- El calendario unificado (/calendario) lo usa para ubicar las ocurrencias recurrentes
-- en el día correcto; sin este dato se anclaban al día de la semana del alta (created_at).
alter table public.agenda add column if not exists dia_semana smallint
  check (dia_semana between 0 and 6);
